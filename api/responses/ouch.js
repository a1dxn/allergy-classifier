module.exports = function ouch(statusCode, description) {
  const req = this.req, res = this.res;

  if(!_.isEmpty(statusCode) && !_.isEmpty(description)) {
    sails.log.warn('*OUCH* ('+statusCode+') '+description);
  }

  if(req.wantsJSON) {
    return res.sendStatus(statusCode).json({ Message: description });
  } else {
    return res.status(statusCode).view('500', { error: statusCode+': '+description });
  }
};
