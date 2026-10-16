// One configured calendar zone for every date filter, review and label.
let current='America/New_York';
export function setTimeZone(zone:string){new Intl.DateTimeFormat('en',{timeZone:zone}).format(0);current=zone;}
export function timeZone(){return current;}
