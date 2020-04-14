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
        1005: 'Sie sind vorübergehend gesperrt.',
        1021: 'Diesen Benutzer gibt es bereits.',
        1002: 'Das Passwort entspricht nicht den Vorgaben.',
        2001: 'Diese Anwendung funktioniert nicht in einer privaten Sitzung.',
    },
    changePassword: {
        1006: 'Das Kennwort ist falsch.',
    },
    deleteAvatar: {
        1019: 'Das Profilbild wurde bereits gelöscht.',
    },
    resetPassword: {
        1015: 'Der Link ist abgelaufen.',
        1016: 'Dieser Link ist ungültig.',
    },
    changeAvatar: {

    },
    deleteAccount: {

    },
    inviteUser: {

    },
    patchConversation: {

    },
    createConversation: {

    },
    uploadMediaFile: {

    },
    refreshMessage: {

    },
    deleteMember: {

    },
    setAdminStatus: {

    },
    revokeInvitation: {

    },
    sendMessage: {
        2002: 'Zeitüberschreitung',
    },
    saveMessage: {
        2002: 'Zeitüberschreitung',
    },
}

export default {
    login: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.login[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    changePassword: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.changePassword[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    deleteAvatar: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.deleteAvatar[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    deleteAccount: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.deleteAccount[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    changeAvatar: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.changeAvatar[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    resetPassword: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.changeAvatar[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    patchConversation: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.patchConversation[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    createConversation: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.createConversation[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    uploadMediaFile: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.uploadMediaFile[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    refreshMessage: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.refreshMessage[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    deleteMember: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.deleteMember[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    revokeInvitation: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.revokeInvitation[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    setAdminStatus: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.setAdminStatus[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    sendMessage: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.sendMessage[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
    saveMessage: (error: ServerError | ClientError) => {
        if (error.info === undefined) return 'Ein Fehler ist aufgetreten'
        return errorMap.saveMessage[error.info.code] || 'Ein Fehler ist aufgetreten'
    },
}

export { ServerError, ClientError }
