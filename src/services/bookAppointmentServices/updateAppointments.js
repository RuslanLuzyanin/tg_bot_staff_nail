const selectedAppointments = {};

function updateSelectedAppointments(userId, userName, date, time, procedure) {
    selectedAppointments[userId] = { userName, date, time, procedure };
}

module.exports = { updateSelectedAppointments, selectedAppointments };
