import { Either, chain, fold, left, right } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";

type ValidationErrors = { errors: string[] };

type ConstrainedEither<A> = Either<ValidationErrors, A>;

const numericEither: ConstrainedEither<number> = right(42);
const stringEither: ConstrainedEither<string> = right(" is the result!");
const failedEither: ConstrainedEither<number> = left({
  errors: ["Total failure"]
});

const divideBy = (x, y): ConstrainedEither<number> => {
  if (y <= 0) {
    return left({ errors: ["You can't divide by 0!"] });
  }

  return right(x / y);
};

const prettify = (num: number, text: string): ConstrainedEither<string> => {
  return right(`${num}${text}`);
};

////////////////////
// Using explicit chain nesting to access things earlier in the chain since TS
// doesn't have proper "do" notation

const nestedEithers1 = () => {
  return pipe(
    stringEither,
    chain(text =>
      pipe(
        numericEither,
        chain(fortyTwo => divideBy(fortyTwo, 2)),
        chain(twentyOne => prettify(twentyOne, text))
      )
    )
  );
};

const willDefinitelyFail1 = (): ConstrainedEither<string> => {
  return pipe(
    stringEither,
    chain(text =>
      pipe(
        numericEither,
        chain(fortyTwo => divideBy(fortyTwo, 0)),
        chain(wontGetHere => prettify(wontGetHere, text))
      )
    )
  );
};

///////////////////
// Working around lack of proper do notation by providing a context object...
// kinda mutable and clunky but it gets around syntactic nesting

const doSet = data => (key, val): ConstrainedEither<object> => {
  data[key] = val;
  return right(data);
};

const nestedEithers2 = (): ConstrainedEither<string> => {
  const data = {};
  const setData = doSet(data);

  return pipe(
    stringEither,
    chain(text => setData("text", text)),
    chain(() => numericEither),
    chain(fortyTwo => divideBy(fortyTwo, 2)),
    chain(twentyOne => prettify(twentyOne, data["text"]))
  );
};

const willDefinitelyFail2 = (): ConstrainedEither<string> => {
  const data = {};
  const setData = doSet(data);

  return pipe(
    stringEither,
    chain(text => setData("text", text)),
    chain(() => numericEither),
    chain(fortyTwo => divideBy(fortyTwo, 0)),
    chain(wontGetHere => prettify(wontGetHere, data["text"]))
  );
};

///////////////////

const handleResult = (result: ConstrainedEither<string>): void => {
  return pipe(
    result,
    fold(
      errorText => console.error("### ERROR: ", errorText),
      text => console.log("### SUCCESS! ", text)
    )
  );
};

handleResult(nestedEithers1());
handleResult(willDefinitelyFail1());
handleResult(nestedEithers2());
handleResult(willDefinitelyFail2());
