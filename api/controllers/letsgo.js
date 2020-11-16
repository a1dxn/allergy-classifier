module.exports = {

  friendlyName: 'Letsgo',

  description: 'Letsgo something.',

  inputs: {},

  exits: {
    JSON: {
      responseType: ''
    }
  },

  fn: async function(inputs, exits) {

    const dataset = await sails.helpers.dataset('shellfish', 'train');
    // console.log(JSON.stringify(dataset));

    exits.JSON(dataset);

  },

};
