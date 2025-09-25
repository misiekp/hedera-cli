export class OutputApi {
  private outputState = {
    json: false,
  };

  public isJsonOutput() {
    return this.outputState.json;
  }

  public printOutput(human: string, data?: unknown) {
    if (this.outputState.json) {
      const payload = data !== undefined ? data : { message: human };
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(payload, null, 2));
    } else {
      // eslint-disable-next-line no-console
      console.log(human);
    }
  }
}
