export default class Poll {
  id?: number = undefined;
  name = "";
  style = 0;
  options: Array<string> = [];
  results: Array<number> = [];
  answersCount = 0;
  maxChosenOptionsCount = 1;

  constructor() {
    this.id = Date.now();
  }
}
