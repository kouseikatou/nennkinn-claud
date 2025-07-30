// 動的データ定義
// UI表示用のデータ構造定義

module.exports = {
  // 申請書データ構造
  Application: {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    applicationNumber: { type: 'STRING(50)', unique: true, required: true },
    applicantName: { type: 'STRING(100)', required: true },
    applicantNameKana: { type: 'STRING(100)', required: true },
    birthDate: { type: 'DATE', required: true },
    gender: { type: 'ENUM', values: ['male', 'female', 'other'], required: true },
    phoneNumber: { type: 'STRING(20)' },
    email: { type: 'STRING(255)', validate: 'email' },
    address: { type: 'TEXT' },
    postalCode: { type: 'STRING(10)' },
    basicPensionNumber: { type: 'STRING(20)' },
    employmentInsuranceNumber: { type: 'STRING(20)' },
    mynumberCardNumber: { type: 'STRING(12)' },
    status: { 
      type: 'ENUM', 
      values: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'returned'],
      default: 'draft'
    },
    submittedAt: { type: 'DATETIME' },
    approvedAt: { type: 'DATETIME' },
    rejectedAt: { type: 'DATETIME' },
    rejectionReason: { type: 'TEXT' },
    reviewerId: { type: 'INTEGER', ref: 'User' },
    createdAt: { type: 'DATETIME' },
    updatedAt: { type: 'DATETIME' }
  },

  // ユーザーデータ構造
  User: {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    email: { type: 'STRING(255)', unique: true, required: true },
    name: { type: 'STRING(100)', required: true },
    role: { type: 'ENUM', values: ['admin', 'reviewer', 'applicant'], default: 'applicant' },
    isActive: { type: 'BOOLEAN', default: true },
    lastLoginAt: { type: 'DATETIME' },
    createdAt: { type: 'DATETIME' },
    updatedAt: { type: 'DATETIME' }
  },

  // 家族構成員データ構造
  FamilyMember: {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    applicationId: { type: 'INTEGER', ref: 'Application', required: true },
    relationship: { type: 'STRING(50)', required: true },
    name: { type: 'STRING(100)', required: true },
    nameKana: { type: 'STRING(100)', required: true },
    birthDate: { type: 'DATE', required: true },
    gender: { type: 'ENUM', values: ['male', 'female', 'other'] },
    occupation: { type: 'STRING(100)' },
    income: { type: 'INTEGER' },
    createdAt: { type: 'DATETIME' },
    updatedAt: { type: 'DATETIME' }
  },

  // 調査データ構造
  Survey: {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    applicationId: { type: 'INTEGER', ref: 'Application', required: true },
    surveyType: { type: 'STRING(50)', required: true },
    surveyDate: { type: 'DATE' },
    surveyor: { type: 'STRING(100)' },
    result: { type: 'TEXT' },
    notes: { type: 'TEXT' },
    status: { type: 'ENUM', values: ['pending', 'completed', 'cancelled'], default: 'pending' },
    createdAt: { type: 'DATETIME' },
    updatedAt: { type: 'DATETIME' }
  },

  // コメントデータ構造
  Comment: {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    applicationId: { type: 'INTEGER', ref: 'Application', required: true },
    userId: { type: 'INTEGER', ref: 'User', required: true },
    content: { type: 'TEXT', required: true },
    isInternal: { type: 'BOOLEAN', default: true },
    createdAt: { type: 'DATETIME' },
    updatedAt: { type: 'DATETIME' }
  },

  // ドキュメントデータ構造
  Document: {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    applicationId: { type: 'INTEGER', ref: 'Application', required: true },
    fileName: { type: 'STRING(255)', required: true },
    fileType: { type: 'STRING(50)' },
    fileSize: { type: 'INTEGER' },
    filePath: { type: 'STRING(500)', required: true },
    uploadedBy: { type: 'INTEGER', ref: 'User' },
    documentType: { type: 'STRING(50)' },
    createdAt: { type: 'DATETIME' },
    updatedAt: { type: 'DATETIME' }
  },

  // 活動ログデータ構造
  Activity: {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    applicationId: { type: 'INTEGER', ref: 'Application' },
    userId: { type: 'INTEGER', ref: 'User' },
    action: { type: 'STRING(100)', required: true },
    description: { type: 'TEXT' },
    metadata: { type: 'JSON' },
    ipAddress: { type: 'STRING(45)' },
    userAgent: { type: 'STRING(500)' },
    createdAt: { type: 'DATETIME' }
  }
};