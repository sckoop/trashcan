import Slack = slack.Slack;
declare namespace slack {
    export interface Slack {
        api: methods.api;
        auth: methods.Auth;
        reminders: methods.Reminders;
        users: methods.Users;
        rtm: rtm.rtm;
    }

    namespace methods {
        export interface api {
            test(arguments: any, callback: ResponseCallback<{args: any, error?: any}>): void;
        }
        interface Auth {
            test(token: TokenRequestArgument, callback: ResponseCallback<AuthTestData>): void;
            revoke(arguments: TokenRequestArgument&{test: boolean}, callback: ResponseCallback<{revoked: boolean}>): void;
        }
        interface Reminders {
            add(arguments: ReminderAddArgument, callback: ResponseCallback<{reminder: Reminder}>): void;
            complete(arguments: ReminderIdArgument, callback: ResponseCallback<void>): void;
            delete(arguments: ReminderIdArgument, callback: ResponseCallback<void>): void;
            info(arguments: ReminderIdArgument, callback: ResponseCallback<{reminder: Reminder}>): void;
            list(token: TokenRequestArgument, callback: ResponseCallback<{reminders: Reminder[]}>): void;
        }
        interface Users {
            getPresence(arguments: UserIdArgument, callback: ResponseCallback<UserPresence>): void;
            identity(token: TokenRequestArgument, callback: ResponseCallback<{user: UserIdentity, team: Team}>): void;
            info(arguments: UserIdArgument, callback: ResponseCallback<{user: UserInfo}>): void;
            list(arguments: TokenRequestArgument&{presence: number}, callback: ResponseCallback<{members: UserInfo[]}>): void;
            setActive(token: TokenRequestArgument, callback: ResponseCallback<void>): void;
            setPresence(token: TokenRequestArgument&{presence: 'auto'|'away'}, callback: ResponseCallback<void>): void;
        }
    }

    namespace rtm {
        interface rtm {
            client(): Client;
        }
        interface Client {
            started(callback: StartedCallback): void;
            user_typing(callback: UserTypingCallback): void;
            listen(token: TokenRequestArgument): void;
            hello(callback: HelloCallback): void;
            close(): void;
        }

        interface HelloCallback {
            (message: any): void
        }

        interface StartedCallback {
            (payload: any): void;
        }

        interface UserTypingCallback {
            (msg: any): void;
        }
    }


    interface TokenRequestArgument {
        token: string;
    }

    interface AuthTestData {
        url: string;
        team: string;
        user: string;
        team_id: string;
        user_id: string;
    }

    interface Reminder {
        id: string;
        creator: string;
        user: string;
        text: string;
        recurring: boolean;
        time?: number; // Exists only when non recurring
        complete_ts?: number; // Exists only when non recurring
    }

    interface ReminderAddArgument extends TokenRequestArgument {
        text: string;
        time: number;
        user?: string;
    }

    interface ReminderIdArgument extends TokenRequestArgument {
        reminder: string;
    }

    interface UserIdArgument extends TokenRequestArgument {
        user: string;
    }

    interface UserPresence {
        presence: string;
        // following information only for the authed user
        online?: boolean;
        auto_away?: boolean;
        manual_away?: boolean;
        connection_count?: number;
        last_activity?: number;
    }

    interface UserIdentity extends User, UserProfilePictures {
        email?: string;
    }

    interface UserInfo extends User {
        deleted: boolean;
        color: string;
        profile: UserProfilePictures&{
            first_name: string;
            last_name: string;
            real_name: string;
            email: string;
            skype: string;
            phone: string;
        }
        is_admin: boolean;
        is_owner: boolean;
        has_2fa: boolean;
        has_files: boolean;
    }

    interface UserProfilePictures {
        "image_24"?: string;
        "image_32"?: string;
        "image_48"?: string;
        "image_72"?: string;
        "image_192"?: string;
    }

    interface User {
        name: string;
        id: string;
    }

    interface Team {
        id: string;
        name?: string;
    }

    interface ResponseCallback<T> {
        (error: any, data: T): void;
    }
}

declare var slack: Slack;

declare module "slack" {
    export = slack;
}

declare module 'slack/methods/api' {
    var api: slack.methods.api;

    export = api;
}

declare module 'slack/methods/api.test' {
    var api: slack.methods.api;

    export = api.test;
}

declare module 'slack/methods/auth' {
    var auth: slack.methods.Auth;

    export = auth;
}

declare module 'slack/methods/reminders' {
    var reminders: slack.methods.Reminders;

    export = reminders;
}

declare module 'slack/methods/users' {
    var users: slack.methods.Users;

    export = users;
}