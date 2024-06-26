
const fs = require('fs');
const path = require('path');

function setNestedProperty(obj, path, value) {
  const pathParts = path.split(/[\.\[\]]/).filter(part => part);
  const lastPart = pathParts.pop();

  const target = pathParts.reduce((prev, curr) => {
    return prev ? prev[curr] : null
  }, obj || self);

  if (target && lastPart) {
    target[lastPart] = value;
  } else {
    console.error('Error setting nested property', path, 'on', obj);
  }
}

module.exports = {
  setNestedProperty
};