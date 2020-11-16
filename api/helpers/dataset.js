const csv = require('csvtojson');

let self = {

  friendlyName: 'Dataset Handler',

  description: 'Handles the parsing and formatting of dataset files',

  inputs: {

    allergyKey: {
      friendlyName: 'Allergy Keyword',
      type        : 'string',
      required    : true,
    },

    setType: {
      friendlyName: 'Dataset Type',
      description : 'Accepts either TRAIN or TEST',
      type        : 'string',
      defaultsTo  : 'TRAIN',
    },

  },

  exits: {

    success: {
      description: 'All done.',
    },

    invalidAllergyKey: {
      description: 'Allergy key not recognised from list of constants.',
    },

    invalidSetType: {
      description: 'Dataset Type not recognised. Accepts only TRAIN or TEST.',
    },

    datasetNotFound: {
      description: 'Dataset was not found with given allergy key and set type.',
    },

  },

  fn: async function(inputs, exits) {
    var startTime = Date.now();
    if(!sails.config.CONSTANTS.DATASET_ALLERGY_KEYWORDS.includes(inputs.allergyKey.toUpperCase())) {
      return exits.invalidAllergyKey({inputs});
    }

    const setKeyword = sails.config.CONSTANTS['DATASET_FILE_KEYWORD_'+inputs.setType.toUpperCase()];
    if(_.isEmpty(setKeyword)) {
      return exits.invalidSetType({inputs});
    }

    const datasetName = inputs.allergyKey.toUpperCase()+'_'+setKeyword;

    //Check if this dataset is already cached...if so return it!
    const cache = sails.hooks.cache.store('datasets');
    let dataset = cache.get(datasetName);
    if(dataset) {
      sails.log.verbose(`Returned from DB in ${Date.now()-startTime}ms`);
      return exits.success(dataset);
    }

    const fullFilePath = sails.config.CONSTANTS.DATASET_FILE_PATH+datasetName
                         +sails.config.CONSTANTS.DATASET_FILE_EXTENSION;

    sails.log.debug("Dataset Handler: "+JSON.stringify({inputs, setKeyword, datasetName, fullFilePath}));

    // const datasetFile  = require(fullFilePath);
    // sails.log.verbose('Dataset file: '+datasetFile);
    // if(datasetFile === undefined) {
    //   return exits.datasetNotFound({ inputs });
    // }

    //1. Lets get all the values minus the allergy class
    const options = {
      noheader     : false,
      output       : 'csv',
      trim         : true,
      checkType    : true,
      ignoreColumns: new RegExp(`${inputs.allergyKey.toUpperCase()}`),
    };
    const values  = await csv(options).fromFile(fullFilePath); //matrix of rows

    //2. Now for the allergy classes... going to switch ignoreColumns with includeColumns from prev step!
    options.includeColumns = options.ignoreColumns;
    delete options.ignoreColumns;
    let classes = await csv(options).fromFile(fullFilePath);
    classes     = _.flatten(classes); //It'll be given in a row matrix however we just need it in an array

    //3. Now lets put it all into a DataSet object!
    dataset = new DataSet(inputs.allergyKey, inputs.setType, values, classes);

    //4. Add it to the cache so future queries can access it then hand it off :)
    cache.set(datasetName, dataset);
    sails.log.verbose(`Returned new obj in ${Date.now()-startTime}ms`);
    return exits.success(dataset);

  },

};

module.exports = self;

class DataSet {

  constructor(key, type, values, classes) {
    this.allergyKey = key.toUpperCase();
    this.type       = type.toUpperCase();
    this._values    = values;
    this._classes   = classes;
  }

  get values() {
    return this._values;
  }

  get classes() {
    return this._classes;
  }

  getRowObj = function(i) {
    return {
      values: this.values[i],
      class : this.classes[i],
    };
  };

  toJSON() {
    return JSON.stringify({
                            allergy: this.allergyKey,
                            setType: this.type,
                            values : this.values,
                            classes: this.classes,
                          });
  }

  parseJSON = function(json) {
    try {
      let x = JSON.parse(json);
      return new DataSet(x.allergy, x.setType, x.values, x.classes);
    } catch(e) {
      throw 'Unable to create DataSet as string provided is not a JSON.';
    }
  }

}
