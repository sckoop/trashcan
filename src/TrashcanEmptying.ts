import * as moment from 'moment';

export class TrashcanEmptying {
    public remindDate: moment.Moment;

    constructor(public date: moment.Moment, public type: string) {
        // @todo configurable
        this.remindDate = this
            .date
            .subtract(1, 'days')
            .hour(18)
            .minute(0);
    }

    public isRemindDateInFuture(): boolean {
        return this.remindDate.diff(moment(), 'hour') > 0;
    }
}
