const DotProp = require("dot-prop");

const defaultOptions = {
  stringifyId: true,
  removeVersion: true,
  removePrivateFields: true,
  removeNullId: true,
  removeUnderscoreId: false,
  toJSON: {
    getters: true,
    virtuals: true,
  },
  toObject: {
    getters: true,
    virtuals: true,
  },
};

/**
 *
 * @param {Object} schema
 * @param {*} pluginOptions
 */
module.exports = function standalizer(schema, pluginOptions) {
  const options = { ...defaultOptions, ...pluginOptions, ...schema.options };
  options.toJSON = { ...defaultOptions.toJSON, ...pluginOptions && pluginOptions.toJSON, ...schema.options && schema.options.toJSON };
  options.toObject = { ...defaultOptions.toObject, ...pluginOptions && pluginOptions.toJSON, ...schema.options && schema.options.toObject };

  if (!schema.options.toJSON) {
    schema.options.toJSON = {};
  }
  if (!schema.options.toObject) {
    schema.options.toObject = {};
  }

  if (options.toJSON) {
    // schema.set("toJSON", options.toJSON);
    Object.assign(schema.options.toJSON, options.toJSON);
  }

  if (options.toObject) {
    // schema.set("toObject", options.toObject);
    Object.assign(schema.options.toObject, options.toObject);
  }

  const originTransformer = schema.options.toJSON.transform;
  Object.assign(schema.options.toJSON, {
    transform(doc, ret, ops) {
      if (options.stringifyId) {
        if (ret._id && typeof ret._id.toString === "function" && ret.id === undefined) {
          ret.id = ret._id.toString();
        }
      }

      if (options.removeVersion && typeof ret.__v !== "undefined") {
        delete ret.__v;
      }

      if (options.removePrivateFields) {
        for (const pathName in schema.paths) {
          if (schema.paths[pathName].options && schema.paths[pathName].options.private === true) {
            if (typeof DotProp.get(ret, pathName) !== "undefined") {
              DotProp.delete(ret, pathName);
            }
          }
        }
      }

      if (options.removeNullId && !schema.paths.id && ret._id === undefined) {
        delete ret.id;
      }

      if (options.removeUnderscoreId && typeof ret._id !== "undefined") {
        delete ret._id;
      }

      if (typeof originTransformer === "function") {
        return originTransformer(doc, ret, ops);
      }

      return ret;
    },
  });
};
