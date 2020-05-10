interface APIError {
    code: number
    message: string
}

interface ServerError {
    code: number,
    statusText: string,
    info?: APIError
}

interface ClientError {
    info: APIError
}

interface IDictionary {
    [key: string]: {[key: number]: string}
}

const errorMap: IDictionary = {
    login: {
        0: 'Ein Fehler ist aufgetreten.',
        1005: 'Sie sind vorübergehend gesperrt.',
        1020: 'Das Kennwort ist falsch.',
        1021: 'Diesen Benutzer gibt es bereits.',
        1022: 'Ihr Konto wurde noch nicht bestätigt.',
        1002: 'Das Passwort entspricht nicht den Vorgaben.',
        2001: 'Diese Anwendung funktioniert nicht in einer privaten Sitzung.',
        1023: 'Die Registrierung ist derzeit deaktiviert.',
    },
    changePassword: {
        0: 'Ein Fehler ist aufgetreten.',
        1006: 'Das Kennwort ist falsch.',
    },
    deleteAvatar: {
        0: 'Ein Fehler ist aufgetreten.',
    },
    resetPassword: {
        0: 'Ein Fehler ist aufgetreten.',
        1015: 'Der Link ist abgelaufen.',
        1016: 'Dieser Link ist ungültig.',
    },
    changeAvatar: {
        0: 'Ein Fehler ist aufgetreten.',
    },
    deleteAccount: {
        0: 'Ein Fehler ist aufgetreten.',
    },
    inviteUser: {
        0: 'Ein Fehler ist aufgetreten.',
        1006: 'Keine Berechtigung',
    },
    patchConversation: {
        0: 'Ein Fehler ist aufgetreten.',
    },
    createConversation: {
        0: 'Ein Fehler ist aufgetreten.',
        1012: 'Ungültiger Titel',
    },
    uploadMediaFile: {
        0: 'Ein Fehler ist aufgetreten.',
    },
    refreshMessage: {
        0: 'Ein Fehler ist aufgetreten.',
    },
    deleteMember: {
        0: 'Ein Fehler ist aufgetreten.',
    },
    setAdminStatus: {
        0: 'Ein Fehler ist aufgetreten.',
    },
    revokeInvitation: {
        0: 'Ein Fehler ist aufgetreten.',
    },
    sendMessage: {
        0: 'Ein Fehler ist aufgetreten.',
        1006: 'Keine Berechtigung',
        2002: 'Zeitüberschreitung',
        1003: 'Nachrichtentyp wird nicht unterstützt.',
    },
    saveMessage: {
        0: 'Ein Fehler ist aufgetreten.',
        1006: 'Keine Berechtigung',
        2002: 'Zeitüberschreitung',
    },
    toggleLiveCodeing: {
        0: 'Ein Fehler ist aufgetreten.',
        1006: 'Keine Berechtigung',
        2002: 'Zeitüberschreitung',
    },
    acceptInvitation: {
        0: 'Ein Fehler ist aufgetreten.',
    },
    denieInvitation: {
        0: 'Ein Fehler ist aufgetreten.',
    },
    sendInvitation: {
        0: 'Ein Fehler ist aufgetreten.',
        1006: 'Keine Berechtigung',
    },
}

function getError(error: ServerError | ClientError | APIError, scope: string): string {
    if ((error as APIError).code !== undefined) {
        return errorMap[scope][(error as APIError).code] || errorMap[scope][0]
    }

    const info = (error as ClientError | ServerError).info
    if (info === undefined) return errorMap[scope][0]
    return errorMap[scope][info.code] || errorMap[scope][0]
}

export default {
    login: (error: ServerError | ClientError | APIError) => getError(error, 'login'),
    changePassword: (error: ServerError | ClientError | APIError) => getError(error, 'changePassword'),
    deleteAvatar: (error: ServerError | ClientError | APIError) => getError(error, 'deleteAvatar'),
    deleteAccount: (error: ServerError | ClientError | APIError) => getError(error, 'deleteAccount'),
    changeAvatar: (error: ServerError | ClientError | APIError) => getError(error, 'changeAvatar'),
    resetPassword: (error: ServerError | ClientError | APIError) => getError(error, 'resetPassword'),
    patchConversation: (error: ServerError | ClientError | APIError) => getError(error, 'patchConversation'),
    createConversation: (error: ServerError | ClientError | APIError) => getError(error, 'createConversation'),
    uploadMediaFile: (error: ServerError | ClientError | APIError) => getError(error, 'uploadMediaFile'),
    refreshMessage: (error: ServerError | ClientError | APIError) => getError(error, 'refreshMessage'),
    deleteMember: (error: ServerError | ClientError | APIError) => getError(error, 'deleteMember'),
    sendInvitation: (error: ServerError | ClientError | APIError) => getError(error, 'sendInvitation'),
    revokeInvitation: (error: ServerError | ClientError | APIError) => getError(error, 'revokeInvitation'),
    acceptInvitation: (error: ServerError | ClientError | APIError) => getError(error, 'acceptInvitation'),
    denieInvitation: (error: ServerError | ClientError | APIError) => getError(error, 'denieInvitation'),
    setAdminStatus: (error: ServerError | ClientError | APIError) => getError(error, 'setAdminStatus'),
    sendMessage: (error: ServerError | ClientError | APIError) => getError(error, 'sendMessage'),
    saveMessage: (error: ServerError | ClientError | APIError) => getError(error, 'saveMessage'),
    toggleLiveCodeing: (error: ServerError | ClientError | APIError) => getError(error, 'toggleLiveCoding'),
}

export { ServerError, ClientError }
