exports.METHOD = "POST";
exports.URL = 'https://brk0401w01-externalapi-webservice.test03-fimbet.com/v2.0/ReadOnlyService.asmx';
exports.BASEHEADER = {
    'Content-Type': 'text/xml'
}

exports.ListTopLevelEvents = () => {
    var xmlData = '<?xml version="1.0" encoding="utf-8"?>\
    \n<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">\
    \n  <soap12:Header>\
    \n    <ExternalApiHeader version="2" languageCode="en" username="fimapi001" password="TestIntegration" currency="GBP"  xmlns="http://www.GlobalBettingExchange.com/ExternalAPI/" />\
    \n  </soap12:Header>\
    \n  <soap12:Body>\
    \n    <ListTopLevelEvents xmlns="http://www.GlobalBettingExchange.com/ExternalAPI/">\
    \n    <listTopLevelEventsRequest />\
    \n    </ListTopLevelEvents>\
    \n  </soap12:Body>\
    \n</soap12:Envelope>';
    return xmlData;
}

exports.GetEventSubTreeNoSelections = (id) => {
    var xmlData = '<?xml version="1.0" encoding="utf-8"?>\
    \n<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">\
    \n  <soap12:Header>\
    \n    <ExternalApiHeader version="2" languageCode="en" username="fimapi001" password="TestIntegration" currency="GBP"  xmlns="http://www.GlobalBettingExchange.com/ExternalAPI/" />\
    \n  </soap12:Header>\
    \n  <soap12:Body>\
    \n    <GetEventSubTreeNoSelections xmlns="http://www.GlobalBettingExchange.com/ExternalAPI/">\
    \n      <getEventSubTreeNoSelectionsRequest>\
    \n        <EventClassifierIds>' + id + '</EventClassifierIds>\
    \n      </getEventSubTreeNoSelectionsRequest>\
    \n    </GetEventSubTreeNoSelections>\
    \n  </soap12:Body>\
    \n</soap12:Envelope>';
    return xmlData
}