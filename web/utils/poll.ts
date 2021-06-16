export default function poll<TResolved>(
  fn,
  timeout,
  intervalArg,
  timeoutMessage,
): Promise<TResolved> {
  const endTime = Number(new Date()) + (timeout || 2000);
  const interval = intervalArg || 100;

  const checkCondition = (resolve, reject) => {
    // If the condition is met, we're done!
    const result = fn();
    if (result) {
      resolve(result);
    // If the condition isn't met but the timeout hasn't elapsed, go again
    } else if (Number(new Date()) < endTime) {
      setTimeout(checkCondition, interval, resolve, reject);
      // Didn't match and too much time, reject!
    } else {
      reject(new Error(timeoutMessage));
    }
  };

  return new Promise(checkCondition);
}
