module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/*
module.exports = (take async function as a parameter) => {  
  return (req, res, next) => { // return a middleware function that inside this middleware function we apply the async function and catch errors if occurs
    fn(req, res, next).catch(next);
  };
};
*/
