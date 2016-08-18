import * as request from "request";
import * as cheerio from "cheerio";
import * as moment from "moment";
import * as slack from "slack";
import { TrashcanEmptying } from "./TrashcanEmptying";
import { IncomingMessage } from "http";
import { config } from 'dotenv';
import Reminder = slack.Reminder;

config();

// todo move into more classes to structure it better.

function fetchTrashDates(): Promise<string> {
    return new Promise((resolve, reject) => {
        request(
            {
                url: `http://www.stadtreinigung.hamburg/privatkunden/abfuhrkalender/#abfuhrkalender`,
                method: 'POST',
                form: {
                    asId: '',
                    strasse: process.env.STREET,
                    hnId: '',
                    hausnummer: process.env.HOUSE_NUMBER,
                    bestaetigung: true,
                    mode: 'search',
                    suche: 'Abfuhrtermine suchen'
                }
            }, (error, response: IncomingMessage, body) => {
                if (error) {
                    // @todo we need to handle this correct.
                    console.log(error);
                    reject(error);
                    return;
                }

                console.log(response.statusCode, 'Response succeded');

                resolve(body);
            }
        )
    });
}

function parseTrashcanEmptying(body: string): Promise<TrashcanEmptying[]> {
    return new Promise((resolve, reject) => {
        if (!body) {
            console.log('Body was empty');
            reject();
            return;
        }
        const $ = cheerio.load(body);
        const removalCalendar = $('#abfuhrkalender table');
        if (!removalCalendar) {
            console.log('Could not find the table with the dates');
            reject();
            return;
        }
        let trashcans: TrashcanEmptying[] = [];
        removalCalendar.children('tr').each((index: number, element: CheerioElement) => {
            const trashcanEmptying = $(element).children();
            if (trashcanEmptying.length === 0) {
                console.log(`Table element ${index} did not contained any children.`);
                return;
            }
            const dateNode = trashcanEmptying.first().text().split(',');
            if (!dateNode[1] || !trashcanEmptying.get(1)) {
                console.log(`Entry ${index} does not contain necessary data`);
                return;
            }
            const date = moment(dateNode[1], 'DD.MM.YYYY');
            if (!date.isValid()) {
                console.log(`Entry ${index} could not be parsed as date.`);
                return;
            }
            const type = $(trashcanEmptying.get(1)).text();
            console.log(`Found ${type}`);
            trashcans.push(
                new TrashcanEmptying(
                    date,
                    type
                )
            );
        });

        resolve(trashcans);
    });
}

function getSlackReminders(): Promise<Reminder[]> {
    return new Promise((resolve, reject) => {
        slack.reminders.list(
            { token: process.env.SLACK_TOKEN },
            (error, response) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(response.reminders);
            });
    });
}

function addSlackReminder(trashcan: TrashcanEmptying): Promise<Reminder> {
    const message = `${trashcan.type} wird am ${trashcan.date.format('DD.MM.YYYY')} abgeholt.`;

    return new Promise(
        (resolve, reject) => {
            slack.reminders.add(
                {
                    token: process.env.SLACK_TOKEN,
                    time: trashcan.remindDate.unix(),
                    text: message
                },
                (error, data: {reminder: slack.Reminder}) => {
                    if (error) {
                        console.log(`ERROR ${trashcan.type} DETAILS: ${error}`);
                        reject(error);
                        return;
                    }
                    console.log(`ADD ${trashcan.type}`);
                    resolve(data.reminder);
                }
            );
        }
    );

}

const filterOnlyFutureEmptying = (trashcans: TrashcanEmptying[]): TrashcanEmptying[] => {
    const futureDates = trashcans.filter((trashcan: TrashcanEmptying) => trashcan.isRemindDateInFuture());
    console.log(`Found ${futureDates.length} trash emptying that will be checked.`);

    return futureDates;
};

const futureTrashcanEmptying = fetchTrashDates()
    .then(parseTrashcanEmptying)
    .then(filterOnlyFutureEmptying);

const isActiveReminder = (reminder: Reminder): boolean => {
    return reminder.complete_ts === 0;
};

const activeReminders = getSlackReminders()
    .then((reminders: Reminder[]): Reminder[] => {
        const activeReminder = reminders.filter((reminder: Reminder) => isActiveReminder(reminder));
        console.log(`Found ${activeReminder.length} active reminders`);

        return activeReminder;
    });

const addReminderPromises = (trashcans: TrashcanEmptying[], activeReminders: Reminder[]): Promise<Reminder>[] => {
    const trashcansWithoutReminder = trashcans.filter((trashcan: TrashcanEmptying) => {
        const existingReminder = activeReminders.find((reminder: Reminder) => reminder.text.indexOf(trashcan.type) !== -1);

        return !existingReminder;

        // return moment.unix(existingReminder.time).diff(trashcan.remindDate) !== 0;
    });

    return trashcansWithoutReminder.map((trashcan: TrashcanEmptying) => addSlackReminder(trashcan));
};

// @todo Update mechanism as well to have correct reminders when dates change
const handleDatesThatNeedUpdate = () => {};

Promise
    .all([
        futureTrashcanEmptying,
        activeReminders
    ])
    .then(([trashDates, reminders]) => Promise.all<Reminder>(
        addReminderPromises(trashDates, reminders)
    ))
    .then((reminders: Reminder[]) => {
        console.log(`In total ${reminders.length} reminders were created or updated.`)
    })
    .catch((error) => console.log);
