const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

async function testDatabase() {
  try {
    console.log('🔍 データベース接続テスト開始...\n');
    
    // データベースパスの確認
    const dbPath = process.env.DB_STORAGE || path.join(__dirname, '../../../../data/development.sqlite');
    console.log(`📁 データベースパス: ${dbPath}`);
    
    // ディレクトリの存在確認
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      console.log(`📁 ディレクトリが存在しません。作成します: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    } else {
      console.log(`✅ ディレクトリ存在確認: ${dbDir}`);
    }
    
    // ファイルの存在とサイズ確認
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`✅ データベースファイル存在確認: ${dbPath}`);
      console.log(`📊 ファイルサイズ: ${stats.size} bytes`);
    } else {
      console.log(`⚠️  データベースファイルが存在しません: ${dbPath}`);
    }
    
    // Sequelize接続の作成
    console.log('\n🔗 Sequelize接続を作成中...');
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: console.log,
      pool: {
        max: 1,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    
    // 接続テスト
    console.log('\n🏃 データベース接続テスト実行中...');
    await sequelize.authenticate();
    console.log('✅ データベース接続成功！');
    
    // バージョン確認
    const [results] = await sequelize.query('SELECT sqlite_version() as version');
    console.log(`📊 SQLiteバージョン: ${results[0].version}`);
    
    // テーブル一覧の取得
    console.log('\n📋 既存のテーブル一覧:');
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    if (tables.length > 0) {
      tables.forEach(table => console.log(`   - ${table.name}`));
    } else {
      console.log('   （テーブルが存在しません）');
    }
    
    // 接続を閉じる
    await sequelize.close();
    console.log('\n✅ データベース接続テスト完了！');
    
  } catch (error) {
    console.error('\n❌ エラーが発生しました:');
    console.error('エラータイプ:', error.constructor.name);
    console.error('エラーメッセージ:', error.message);
    console.error('スタックトレース:', error.stack);
  }
}

// スクリプトを実行
testDatabase();