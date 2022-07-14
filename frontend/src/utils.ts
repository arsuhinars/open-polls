import { ErrorTypes } from "open-polls";

function range(n: number): IterableIterator<number>;
function range(start: number, end: number): IterableIterator<number>;
function range(
  start: number,
  end: number,
  step: number
): IterableIterator<number>;
function* range(a: number, b?: number, c?: number) {
  let start = 0;
  let end = 0;
  let step = 1;

  if (c == undefined && b == undefined) {
    end = a;
  } else if (c == undefined && b != undefined) {
    start = a;
    end = b;
  } else if (c != undefined && b != undefined) {
    start = a;
    end = b;
    step = c;
  }

  if (step == 0) {
    yield start;
    yield end;
  } else if (step > 0) {
    for (let i = start; i < end; i += step) {
      yield i;
    }
  } else {
    for (let i = start; i > end; i += step) {
      yield i;
    }
  }
}
export { range };

export function getErrorTitleKey(errorType: ErrorTypes) {
  switch (errorType) {
    case ErrorTypes.VK_LOGIN_ERROR:
      return "errors.vk_login_error_title";
    case ErrorTypes.AUTHORIZATION_REQUIRED:
      return "errors.unauthorized_error_title";
    case ErrorTypes.NOT_FOUND_ERROR:
      return "errors.not_found_error_title";
    case ErrorTypes.FORBIDDEN:
      return "errors.forbidden_title";
    default:
      return "errors.unknown_error_title";
  }
}

export function getErrorDescriptionKey(errorType: ErrorTypes) {
  switch (errorType) {
    case ErrorTypes.VK_LOGIN_ERROR:
      return "errors.vk_login_error_description";
    case ErrorTypes.AUTHORIZATION_REQUIRED:
      return "errors.unauthorized_error_description";
    case ErrorTypes.NOT_FOUND_ERROR:
      return "errors.not_found_error_description";
    case ErrorTypes.FORBIDDEN:
      return "errors.forbidden_description";
    default:
      return "errors.unknown_error_description";
  }
}

export function selectElementsContent(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);

  const selection = document.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function findSum(array: Array<number>) {
  return array.reduce((prev, curr) => prev + curr, 0);
}
