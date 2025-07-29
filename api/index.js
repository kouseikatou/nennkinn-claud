const express = require('express');
const cors = require('cors');

// バックエンドアプリケーションをインポート
const backendApp = require('../project-management-app/backend/src/index.js');

// Vercel用のハンドラー
module.exports = backendApp;