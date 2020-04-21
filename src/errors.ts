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
        0: 'Ein Fehler ist aufgetreten',
        1005: 'Sie sind vorübergehend gesperrt.',
        1021: 'Diesen Benutzer gibt es bereits.',
        1022: 'Ihr Konto wurde noch nicht bestätigt.',
        1002: 'Das Passwort entspricht nicht den Vorgaben.',
        2001: 'Diese Anwendung funktioniert nicht in einer privaten Sitzung.',
    },
    changePassword: {
        0: 'Ein Fehler ist aufgetreten',
        1006: 'Das Kennwort ist falsch.',
    },
    deleteAvatar: {
        0: 'Ein Fehler ist aufgetreten',
        1019: 'Das Profilbild wurde bereits gelöscht.',
    },
    resetPassword: {
        0: 'Ein Fehler ist aufgetreten',
        1015: 'Der Link ist abgelaufen.',
        1016: 'Dieser Link ist ungültig.',
    },
    changeAvatar: {
        0: 'Ein Fehler ist aufgetreten',
    },
    deleteAccount: {
        0: 'Ein Fehler ist aufgetreten',
    },
    inviteUser: {
        0: 'Ein Fehler ist aufgetreten',
    },
    patchConversation: {
        0: 'Ein Fehler ist aufgetreten',
    },
    createConversation: {
        0: 'Ein Fehler ist aufgetreten',
    },
    uploadMediaFile: {
        0: 'Ein Fehler ist aufgetreten',
    },
    refreshMessage: {
        0: 'Ein Fehler ist aufgetreten',
    },
    deleteMember: {
        0: 'Ein Fehler ist aufgetreten',
    },
    setAdminStatus: {
        0: 'Ein Fehler ist aufgetreten',
    },
    revokeInvitation: {
        0: 'Ein Fehler ist aufgetreten',
    },
    sendMessage: {
        0: 'Ein Fehler ist aufgetreten',
        2002: 'Zeitüberschreitung',
    },
    saveMessage: {
        0: 'Ein Fehler ist aufgetreten',
        2002: 'Zeitüberschreitung',
    },
}

export default {
    login: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.login[0]
        return errorMap.login[error.info.code] || errorMap.login[0]
    },
    changePassword: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.changePassword[0]
        return errorMap.changePassword[error.info.code] || errorMap.changePassword[0]
    },
    deleteAvatar: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.deleteAvatar[0]
        return errorMap.deleteAvatar[error.info.code] || errorMap.deleteAvatar[0]
    },
    deleteAccount: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.deleteAccount[0]
        return errorMap.deleteAccount[error.info.code] || errorMap.deleteAccount[0]
    },
    changeAvatar: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.changeAvatar[0]
        return errorMap.changeAvatar[error.info.code] || errorMap.changeAvatar[0]
    },
    resetPassword: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.resetPassword[0]
        return errorMap.resetPassword[error.info.code] || errorMap.resetPassword[0]
    },
    patchConversation: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.patchConversation[0]
        return errorMap.patchConversation[error.info.code] || errorMap.patchConversation[0]
    },
    createConversation: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.createConversation[0]
        return errorMap.createConversation[error.info.code] || errorMap.createConversation[0]
    },
    uploadMediaFile: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.uploadMediaFile[0]
        return errorMap.uploadMediaFile[error.info.code] || errorMap.uploadMediaFile[0]
    },
    refreshMessage: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.refreshMessage[0]
        return errorMap.refreshMessage[error.info.code] || errorMap.refreshMessage[0]
    },
    deleteMember: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.deleteMember[0]
        return errorMap.deleteMember[error.info.code] || errorMap.deleteMember[0]
    },
    revokeInvitation: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.revokeInvitation[0]
        return errorMap.revokeInvitation[error.info.code] || errorMap.revokeInvitation[0]
    },
    setAdminStatus: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.setAdminStatus[0]
        return errorMap.setAdminStatus[error.info.code] || errorMap.setAdminStatus[0]
    },
    sendMessage: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.sendMessage[0]
        return errorMap.sendMessage[error.info.code] || errorMap.sendMessage[0]
    },
    saveMessage: (error: ServerError | ClientError) => {
        if (error.info === undefined) return errorMap.saveMessage[0]
        return errorMap.saveMessage[error.info.code] || errorMap.saveMessage[0]
    },
}

export { ServerError, ClientError }
