const Alexa = require('ask-sdk-core');
const axios = require('axios');

// 1. Text strings ================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function

const welcomeOutput = "Let's plan a beach vacation. Where would you like to go?";
const welcomeReprompt = "Let me know where you'd like to go or when you'd like to travel";
const helpOutput = 'You can demonstrate the delegate directive by saying "vacation assistant".';
const helpReprompt = 'Try saying "vacation assistant".';
const tripIntro = [
  'This sounds like a cool trip. ',
  'This will be fun. ',
  'Oh, I like this trip. ',
];

const deals = [
  'Dreams Punta Cana in an Ocean Front Suit for $1168 per person. ',
  'Now Amber Puerto Vallarta in a Beach front Junior Suite for $1453 per person. ',
  'Allegro Cozumel in a Gardenview room for $869 per person. ',
];

function getBeachBoundResults(fromCity,destination,travelDate,duration){
  const URL = 'https://book.beachbound.com/search/externalformpost.aspx';
  const gsVendor = 'BEV';
  const gdsPackage = 'AH01';
  const gsvacationtype = 'AH01';
  const currentCulture = 'en-US';
  const gsNumberofAdults = '2';
  const gsNumberofTravelers = '2';
  const gsOrigin = 'ATL';
  const gsDestination = 'CUN';
  const fsLengthofStay = '3';
  const gsDepartureDate = '12/05/2018';
  
  axios.post(URL, {
    gsVendor: gsVendor,
    gdsPackage: gdsPackage,
    gsvacationtype: gsvacationtype,
    currentCulture: currentCulture,
    gsOrigin: gsOrigin,
    gsDestination: gsDestination,
    fsLengthofStay: fsLengthofStay,
    gsDepartureDate: gsDepartureDate,
    gsNumberofAdults: gsNumberofAdults,
    gsNumberofTravelers: gsNumberofTravelers
  }
  )  
  .then(function (response) {
    console.log(response);
    return response;
  })
  .catch(function (error) {
    console.log(error);
    return false;
  });
}

// 1. Intent Handlers =============================================

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    return responseBuilder
      .speak(welcomeOutput)
      .reprompt(welcomeReprompt)
      .getResponse();
  },
};

const InProgressPlanMyTripHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'TakeATrip' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  },
};

const CompletedPlanMyTripHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'TakeATrip';
  },
  handle(handlerInput) {
    console.log('Vacation Assistant - handle');

    const responseBuilder = handlerInput.responseBuilder;
    const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
    const slotValues = getSlotValues(filledSlots);
    
    const fromCity = 'ATL';
    const destination = 'CUN';
    const travelDate = "12/1/2018";

    const dealResults = getBeachBoundResults(fromCity,destination,travelDate);


    // compose speechOutput that simply reads all the collected slot values
    let speechOutput = getRandomPhrase(tripIntro);

    speechOutput += "You want to go to the beach ";

    // Now let's recap the trip
    speechOutput = `${speechOutput} from ${slotValues.fromCity.synonym} on ${slotValues.travelDate.synonym}`;

    speechOutput += '<break time="2s" /> I\'ve found you a perfect deal at ';
    
    speechOutput += getRandomPhrase(deals);
    
    speechOutput += '<break time="0.5s" />Have fun!';

    return responseBuilder
      .speak(speechOutput)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    return responseBuilder
      .speak(helpOutput)
      .reprompt(helpReprompt)
      .getResponse();
  },
};

const CancelStopHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    const speechOutput = 'Okay, talk to you later! ';

    return responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const SessionEndedHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const request = handlerInput.requestEnvelope.request;

    console.log(`Original Request was: ${JSON.stringify(request, null, 2)}`);
    console.log(`Error handled: ${error}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can not understand the command.  Please say again.')
      .reprompt('Sorry, I can not understand the command.  Please say again.')
      .getResponse();
  },
};

// 2. Helper Functions ============================================================================

function getSlotValues(filledSlots) {
  const slotValues = {};

  console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
  Object.keys(filledSlots).forEach((item) => {
    const name = filledSlots[item].name;

    if (filledSlots[item] &&
      filledSlots[item].resolutions &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
      switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        case 'ER_SUCCESS_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
            isValidated: true,
          };
          break;
        case 'ER_SUCCESS_NO_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].value,
            isValidated: false,
          };
          break;
        default:
          break;
      }
    } else {
      slotValues[name] = {
        synonym: filledSlots[item].value,
        resolved: filledSlots[item].value,
        isValidated: false,
      };
    }
  }, this);

  return slotValues;
}

function getRandomPhrase(array) {
  // the argument is an array [] of words or phrases
  const i = Math.floor(Math.random() * array.length);
  return (array[i]);
}

// 4. Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    InProgressPlanMyTripHandler,
    CompletedPlanMyTripHandler,
    CancelStopHandler,
    HelpHandler,
    SessionEndedHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();


