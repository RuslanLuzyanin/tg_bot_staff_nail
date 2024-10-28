const { Scenes } = require('telegraf');

const {
    enterNotificationText,
    enterNotificationPhoto,
    saveNotification,
} = require('./controllers/notificationMethods');
const {
    enterRussianName,
    enterDuration,
    saveProcedure,
    enterNewProcedureDuration,
    saveUpdatedProcedure,
} = require('./controllers/procedureMethods');
const { enterDayOffDates, saveDayOffRecords } = require('./controllers/dayOffMethods');
const { enterPortfolioPhoto, savePortfolioPhoto } = require('./controllers/portfolioMethods');
const { enterPricePhoto, savePricePhoto } = require('./controllers/priceMethods');
const { enterStartTime, enterEndTime, saveWorkingHours } = require('./controllers/workingHoursMethods');

const createNotification = new Scenes.WizardScene(
    'create_notification',
    enterNotificationText,
    enterNotificationPhoto,
    saveNotification
);
const createProcedure = new Scenes.WizardScene(
    'create_procedure',
    enterRussianName,
    enterDuration,
    saveProcedure
);
const editProcedure = new Scenes.WizardScene(
    'edit_procedure',
    enterNewProcedureDuration,
    saveUpdatedProcedure
);
const updateDayOff = new Scenes.WizardScene('update_day_off', enterDayOffDates, saveDayOffRecords);
const updatePortfolio = new Scenes.WizardScene('update_portfolio', enterPortfolioPhoto, savePortfolioPhoto);
const updatePrice = new Scenes.WizardScene('update_price', enterPricePhoto, savePricePhoto);
const updateWorkingHours = new Scenes.WizardScene(
    'update_working_hours',
    enterStartTime,
    enterEndTime,
    saveWorkingHours
);

const scenes = [
    createNotification,
    createProcedure,
    editProcedure,
    updateDayOff,
    updatePortfolio,
    updatePrice,
    updateWorkingHours,
];

module.exports = scenes;
