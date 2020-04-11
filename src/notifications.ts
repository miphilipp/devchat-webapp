function supportsNotifications(): boolean {
    return 'Notification' in window
}

function hasChoiceBeenMade(): boolean {
    return Notification.permission === 'granted' || Notification.permission === 'denied'
}

async function requestNotificationPermission(): Promise<boolean> {
    const res = await Notification.requestPermission()
    return res === 'granted'
}

export {
    supportsNotifications,
    hasChoiceBeenMade,
    requestNotificationPermission,
}
