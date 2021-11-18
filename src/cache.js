const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { addHours } = require('./utils');

const CACHE_FOLDER = process.env.VC19_CACHE_FOLDER || '.cache';
const CRL_FILE = 'crl.json';
const RULES_FILE = 'rules.json';
const SIGNATURES_LIST_FILE = 'signatureslist.json';
const SIGNATURES_FILE = 'signatures.json';

const CRL_FILE_PATH = path.join(CACHE_FOLDER, CRL_FILE);
const SIGNATURES_FILE_PATH = path.join(CACHE_FOLDER, SIGNATURES_FILE);
const RULES_FILE_PATH = path.join(CACHE_FOLDER, RULES_FILE);
const SIGNATURES_LIST_FILE_PATH = path.join(CACHE_FOLDER, SIGNATURES_LIST_FILE);

const UPDATE_WINDOW_HOURS = 24;

const UVCI = mongoose.model('UVCI', new mongoose.Schema({
  _id: String,
}));

const fileNeedsUpdate = (filePath) => {
  try {
    if (addHours(fs.statSync(filePath).mtime, UPDATE_WINDOW_HOURS) > new Date(Date.now())) {
      return false;
    }
  } catch (err) {
    // Needs update
  }
  return true;
};

const setUp = async () => {
  fs.promises.mkdir(CACHE_FOLDER, { recursive: true });
  if (!fs.existsSync(CRL_FILE_PATH)) {
    fs.writeFileSync(CRL_FILE_PATH, JSON.stringify({ chunk: 1, version: 0 }));
  }
  await mongoose.connect(process.env.VC19_MONGODB_URL || 'mongodb://root:example@localhost:27017/VC19?authSource=admin');
};

const storeCRLStatus = (chunk = 1, version = 0) => {
  fs.writeFileSync(CRL_FILE_PATH, JSON.stringify({ chunk, version }));
};

const storeRules = (data) => {
  fs.writeFileSync(RULES_FILE_PATH, data);
};

const storeSignaturesList = (data) => {
  fs.writeFileSync(SIGNATURES_LIST_FILE_PATH, data);
};

const storeSignatures = (data) => {
  fs.writeFileSync(SIGNATURES_FILE_PATH, data);
};

const needRulesUpdate = () => fileNeedsUpdate(RULES_FILE_PATH);

const needSignaturesUpdate = () => fileNeedsUpdate(SIGNATURES_FILE_PATH);

const needSignaturesListUpdate = () => fileNeedsUpdate(SIGNATURES_LIST_FILE_PATH);

const getCRLStatus = () => JSON.parse(fs.readFileSync(CRL_FILE_PATH));

const getRules = () => JSON.parse(fs.readFileSync(RULES_FILE_PATH));

const getSignatureList = () => JSON.parse(fs.readFileSync(SIGNATURES_LIST_FILE_PATH));

const getSignatures = () => JSON.parse(fs.readFileSync(SIGNATURES_FILE_PATH));

const storeCRLRevokedUCVI = async (revokedUcvi) => {
  const revokedUcviForDb = revokedUcvi.map((uvci) => ({ _id: uvci }));
  if (revokedUcviForDb.length !== 0) {
    await UVCI.insertMany(revokedUcviForDb);
  }
};

const isUVCIRevoked = async (uvci) => (!!await UVCI.findOne({ _id: uvci }));

const tearDown = async () => {
  await mongoose.disconnect();
};

module.exports = {
  setUp,
  storeRules,
  storeSignaturesList,
  storeSignatures,
  getRules,
  getSignatureList,
  getSignatures,
  needRulesUpdate,
  needSignaturesListUpdate,
  needSignaturesUpdate,
  getCRLStatus,
  storeCRLStatus,
  storeCRLRevokedUCVI,
  isUVCIRevoked,
  tearDown,
};
