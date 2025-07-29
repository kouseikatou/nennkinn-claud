// API configuration
const getAPIBaseURL = () => {
  // 本番環境判定（ドメインベースで判定）
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';  // Vercel上では相対パス
  }
  // 開発環境
  return 'http://localhost:3002/api';
};

const API_BASE_URL = getAPIBaseURL();

// 認証ヘッダーを取得（開発環境では認証をスキップ可能）
const getAuthHeaders = () => {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // 開発環境で認証をスキップする場合の設定
    const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const skipAuth = isDevMode && localStorage.getItem('skipAuth') === 'true';
    
    console.log('🔧 認証ヘッダー生成:', { isDevMode, skipAuth, skipAuthValue: localStorage.getItem('skipAuth') });
    
    if (skipAuth) {
        // テストモードヘッダーを追加
        headers['X-Test-Mode'] = 'true';
        console.log('🔧 テストモードヘッダーを追加');
    } else {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        console.log('🔧 認証トークン:', token ? 'あり' : 'なし');
    }
    
    return headers;
};

// Application API service
const ApplicationAPI = {
    // Get all applications
    async getApplications(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_BASE_URL}/applications?${queryString}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                let errorMessage = 'Failed to fetch applications';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = `${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching applications:', error);
            throw error;
        }
    },

    // Get single application
    async getApplication(id) {
        try {
            const headers = getAuthHeaders();
            console.log('🔧 getApplication リクエスト:', `${API_BASE_URL}/applications/${id}`, headers);
            
            const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
                headers: headers
            });
            
            if (!response.ok) {
                let errorMessage = 'Failed to fetch application';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = `${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching application:', error);
            throw error;
        }
    },

    // Create new application
    async createApplication(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/applications`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                let errorMessage = 'Failed to create application';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = `${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating application:', error);
            throw error;
        }
    },

    // Update application
    async updateApplication(id, data) {
        try {
            const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                let errorMessage = 'Failed to update application';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // Use HTTP status text if JSON parsing fails
                    errorMessage = `${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating application:', error);
            throw error;
        }
    },

    // Delete application
    async deleteApplication(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to delete application');
            return await response.json();
        } catch (error) {
            console.error('Error deleting application:', error);
            throw error;
        }
    }
};

// Survey API service
const SurveyAPI = {
    // Save survey data
    async saveSurvey(applicationId, surveyType, data, status = 'draft') {
        try {
            const response = await fetch(`${API_BASE_URL}/surveys/${applicationId}/${surveyType}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ data, status })
            });
            
            if (!response.ok) throw new Error('Failed to save survey');
            return await response.json();
        } catch (error) {
            console.error('Error saving survey:', error);
            throw error;
        }
    },

    // Get survey data
    async getSurvey(applicationId, surveyType) {
        try {
            const response = await fetch(`${API_BASE_URL}/surveys/${applicationId}/${surveyType}`, {
                headers: getAuthHeaders()
            });
            
            if (response.status === 404) {
                // Survey not found, return null (this is expected behavior)
                console.log(`📋 ${surveyType} アンケート未作成 (application: ${applicationId})`);
                return null;
            }
            
            if (!response.ok) {
                let errorMessage = 'Failed to fetch survey';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = `${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            return await response.json();
        } catch (error) {
            // Don't log 404 errors as they are expected behavior
            if (!error.message.includes('404')) {
                console.error('Error fetching survey:', error);
            }
            throw error;
        }
    },

    // Get all surveys for an application
    async getAllSurveys(applicationId) {
        try {
            const response = await fetch(`${API_BASE_URL}/surveys/${applicationId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to fetch surveys');
            return await response.json();
        } catch (error) {
            console.error('Error fetching surveys:', error);
            throw error;
        }
    },

    // Delete survey
    async deleteSurvey(applicationId, surveyType) {
        try {
            const response = await fetch(`${API_BASE_URL}/surveys/${applicationId}/${surveyType}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to delete survey');
            return await response.json();
        } catch (error) {
            console.error('Error deleting survey:', error);
            throw error;
        }
    }
};

// 開発環境での認証スキップ機能
const DevAuth = {
    // 認証をスキップする（開発環境のみ）
    skipAuth() {
        const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isDevMode) {
            localStorage.setItem('skipAuth', 'true');
            console.log('🔓 開発環境：認証をスキップしました');
        } else {
            console.warn('⚠️ 本番環境では認証スキップは無効です');
        }
    },
    
    // 認証を有効にする
    enableAuth() {
        localStorage.removeItem('skipAuth');
        console.log('🔒 認証を有効にしました');
    },
    
    // 認証状態を確認
    isAuthSkipped() {
        const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isDevMode && localStorage.getItem('skipAuth') === 'true';
    }
};

// Form data collection helper
function collectFormData() {
    const formData = {
        // Basic information
        applicantName: document.getElementById('applicantName')?.value || document.querySelector('input[placeholder="田中太郎"]')?.value || '',
        applicantNameKana: document.getElementById('applicantNameKana')?.value || document.querySelector('input[placeholder="タナカタロウ"]')?.value || '',
        birthDate: document.getElementById('birthDate')?.value || document.querySelectorAll('input[type="date"]')[0]?.value || '',
        gender: document.getElementById('gender')?.value || document.querySelectorAll('select')[0]?.value || 'male',
        pensionNumber: document.getElementById('pensionNumber')?.value || document.querySelector('input[placeholder="1234-567890"]')?.value || '',
        myNumber: document.getElementById('myNumber')?.value || document.querySelector('input[placeholder="123456789012"]')?.value || '',
        phoneNumber: document.getElementById('phoneNumber')?.value || document.querySelector('input[placeholder="03-1234-5678"]')?.value || document.querySelector('input[placeholder="090-1234-5678"]')?.value || '',
        email: document.getElementById('email')?.value || document.querySelector('input[placeholder="taro@example.com"]')?.value || document.querySelector('input[placeholder="example@email.com"]')?.value || null,
        postalCode: document.querySelector('input[placeholder="123-4567"]')?.value || '',
        address: document.getElementById('address')?.value || document.querySelector('input[placeholder="東京都新宿区西新宿1-1-1"]')?.value || document.querySelector('textarea[placeholder="東京都新宿区..."]')?.value || '',
        
        // Disability information - provide defaults for required fields
        disabilityType: document.querySelectorAll('select')[1]?.value || 'mental',
        disabilityDescription: document.querySelector('input[placeholder="うつ病、統合失調症など"]')?.value || '',
        onsetDate: document.querySelectorAll('input[type="date"]')[1]?.value || '',
        disabilityGrade: document.querySelectorAll('select')[2]?.value || null,
        
        // Medical information
        hospitalName: document.querySelector('input[placeholder="○○病院、○○クリニック"]')?.value || '',
        doctorName: document.querySelector('input[placeholder="田中医師"]')?.value || '',
        diagnosisDate: document.querySelectorAll('input[type="date"]')[2]?.value || null,
        
        // Financial information
        monthlyIncome: document.querySelector('input[placeholder="0"]')?.value || null,
        
        // Family members
        familyMembers: collectFamilyMembers()
    };
    
    // Convert empty strings to null for optional fields
    Object.keys(formData).forEach(key => {
        if (formData[key] === '' && !['applicantName', 'applicantNameKana', 'birthDate', 'gender', 'disabilityType'].includes(key)) {
            formData[key] = null;
        }
    });
    
    console.log('📋 収集されたフォームデータ:', formData);
    return formData;
}

// Collect family members data
function collectFamilyMembers() {
    const familyMembers = [];
    
    // Collect spouse data if exists
    const hasSpouse = document.querySelector('input[name="hasSpouse"]:checked')?.value === 'true';
    if (hasSpouse) {
        const spouseInputs = document.getElementById('spouseInfo').querySelectorAll('input, select');
        if (spouseInputs.length >= 5) {
            familyMembers.push({
                memberType: 'spouse',
                name: spouseInputs[0].value || '',
                nameKana: spouseInputs[1].value || '',
                myNumber: spouseInputs[2].value?.trim() || null,
                basicPensionNumber: spouseInputs[3].value?.trim() || null,
                birthDate: spouseInputs[4].value || null
            });
        }
    }
    
    // Collect children data
    const childrenList = document.getElementById('childrenList');
    const childCards = childrenList.querySelectorAll('.border.border-notion-gray-200');
    
    childCards.forEach(card => {
        const inputs = card.querySelectorAll('input, select');
        if (inputs.length >= 4) {
            familyMembers.push({
                memberType: 'child',
                name: inputs[0].value || '',
                nameKana: inputs[1].value || '',
                myNumber: inputs[2].value?.trim() || null,
                birthDate: inputs[3].value || null
            });
        }
    });
    
    return familyMembers;
}

// Save application
async function saveApplication() {
    try {
        // Show loading notification
        showNotification('保存中...', 'info');
        
        const formData = collectFormData();
        console.log('🔧 保存するフォームデータ:', formData);
        
        const urlParams = new URLSearchParams(window.location.search);
        const applicationId = urlParams.get('edit');
        
        // 開発環境で認証をスキップ
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            DevAuth.skipAuth();
        }
        
        let result;
        if (applicationId && applicationId !== 'new') {
            // Update existing application
            result = await ApplicationAPI.updateApplication(applicationId, formData);
            showNotification('申請情報を更新しました', 'success');
        } else {
            // Create new application
            result = await ApplicationAPI.createApplication(formData);
            showNotification('新規申請を作成しました', 'success');
            
            // Redirect to edit mode with new ID
            if (result && result.application && result.application.id) {
                window.location.href = `project-unified.html?edit=${result.application.id}`;
            }
        }
        
        console.log('✅ 申請保存成功:', result);
        return result;
        
    } catch (error) {
        console.error('❌ 申請保存エラー:', error);
        
        // Display specific error message
        let errorMsg = '保存中にエラーが発生しました';
        if (error.message) {
            // Check for common error scenarios
            if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMsg = 'ネットワークエラー: サーバーに接続できません';
            } else if (error.message.includes('401') || error.message.includes('authenticate')) {
                errorMsg = '認証エラー: ログインが必要です';
            } else if (error.message.includes('400') || error.message.includes('validation')) {
                errorMsg = '入力エラー: 入力内容を確認してください';
            } else if (error.message.includes('500')) {
                errorMsg = 'サーバーエラー: しばらく時間をおいて再度お試しください';
            } else {
                errorMsg = `エラー: ${error.message}`;
            }
        }
        
        showNotification(errorMsg, 'error');
        throw error; // Re-throw for debugging purposes
    }
}

// Load application data
async function loadApplication(applicationId) {
    try {
        // 開発環境で認証をスキップ
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            DevAuth.skipAuth();
            console.log('🔧 認証スキップ設定:', localStorage.getItem('skipAuth'));
            console.log('🔧 APIベースURL:', API_BASE_URL);
        }
        
        const result = await ApplicationAPI.getApplication(applicationId);
        const application = result.application;
        
        console.log('🔧 読み込んだアプリケーションデータ:', application);
        
        // Populate form fields
        populateFormFields(application);
        
        // デバッグ：フィールドが正しく設定されたか確認
        setTimeout(() => {
            console.log('🔧 フィールド設定後の値確認:');
            console.log('名前:', document.getElementById('applicantName')?.value);
            console.log('電話番号:', document.getElementById('phoneNumber')?.value);
            console.log('メール:', document.getElementById('email')?.value);
            console.log('住所:', document.getElementById('address')?.value);
        }, 100);
        
        // Populate family members
        if (application.familyMembers && application.familyMembers.length > 0) {
            populateFamilyMembers(application.familyMembers);
        }
        
        console.log('✅ 申請データを読み込みました:', application.applicationNumber);
        
    } catch (error) {
        console.error('❌ データ読み込みエラー:', error);
        
        let errorMsg = 'データの読み込みに失敗しました';
        if (error.message.includes('404') || error.message.includes('not found')) {
            errorMsg = '申請データが見つかりません';
        } else if (error.message.includes('401') || error.message.includes('authenticate')) {
            errorMsg = '認証エラー: ログインが必要です';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMsg = 'ネットワークエラー: サーバーに接続できません';
        }
        
        showNotification(errorMsg, 'error');
    }
}

// Populate form fields
function populateFormFields(data) {
    // Basic information - Use ID first, then fallback to placeholder
    const nameInput = document.getElementById('applicantName') || document.querySelector('input[placeholder="田中太郎"]');
    if (nameInput) nameInput.value = data.applicantName || '';
    
    const kanaInput = document.getElementById('applicantNameKana') || document.querySelector('input[placeholder="タナカタロウ"]');
    if (kanaInput) kanaInput.value = data.applicantNameKana || '';
    
    const birthDateInput = document.getElementById('birthDate') || document.querySelectorAll('input[type="date"]')[0];
    if (birthDateInput) birthDateInput.value = data.birthDate || '';
    
    const genderSelect = document.getElementById('gender') || document.querySelectorAll('select')[0];
    if (genderSelect) genderSelect.value = data.gender || '';
    
    // 基礎年金番号の追加
    const pensionNumberInput = document.getElementById('pensionNumber') || document.querySelector('input[placeholder="1234-567890"]');
    if (pensionNumberInput) pensionNumberInput.value = data.pensionNumber || '';
    
    // マイナンバーの追加
    const myNumberInput = document.getElementById('myNumber') || document.querySelector('input[placeholder="123456789012"]');
    if (myNumberInput) myNumberInput.value = data.myNumber || '';
    
    // 電話番号 - ID属性を優先使用
    const phoneInput = document.getElementById('phoneNumber') || 
                      document.querySelector('input[placeholder="03-1234-5678"]') || 
                      document.querySelector('input[placeholder="090-1234-5678"]');
    if (phoneInput) phoneInput.value = data.phoneNumber || '';
    
    // メールアドレス - ID属性を優先使用
    const emailInput = document.getElementById('email') || 
                      document.querySelector('input[placeholder="taro@example.com"]') || 
                      document.querySelector('input[placeholder="example@email.com"]');
    if (emailInput) emailInput.value = data.email || '';
    
    const postalCodeInput = document.querySelector('input[placeholder="123-4567"]');
    if (postalCodeInput) postalCodeInput.value = data.postalCode || '';
    
    // 住所 - ID属性を優先使用
    const addressInput = document.getElementById('address') || 
                        document.querySelector('input[placeholder="東京都新宿区西新宿1-1-1"]') || 
                        document.querySelector('textarea[placeholder="東京都新宿区..."]');
    if (addressInput) addressInput.value = data.address || '';
    
    // Disability information
    const disabilityTypeSelect = document.querySelectorAll('select')[1];
    if (disabilityTypeSelect) disabilityTypeSelect.value = data.disabilityType || '';
    
    const disabilityDescInput = document.querySelector('input[placeholder="うつ病、統合失調症など"]');
    if (disabilityDescInput) disabilityDescInput.value = data.disabilityDescription || '';
    
    const onsetDateInput = document.querySelectorAll('input[type="date"]')[1];
    if (onsetDateInput) onsetDateInput.value = data.onsetDate || '';
    
    const gradeSelect = document.querySelectorAll('select')[2];
    if (gradeSelect) gradeSelect.value = data.disabilityGrade || '';
    
    // Medical information
    const hospitalInput = document.querySelector('input[placeholder="○○病院、○○クリニック"]');
    if (hospitalInput) hospitalInput.value = data.hospitalName || '';
    
    const doctorInput = document.querySelector('input[placeholder="田中医師"]');
    if (doctorInput) doctorInput.value = data.doctorName || '';
    
    const diagnosisDateInput = document.querySelectorAll('input[type="date"]')[2];
    if (diagnosisDateInput) diagnosisDateInput.value = data.diagnosisDate || '';
    
    // Financial information
    const monthlyIncomeInput = document.querySelector('input[placeholder="0"]');
    if (monthlyIncomeInput) monthlyIncomeInput.value = data.monthlyIncome || '';
    
    // Additional fields specific to project-unified.html
    const currentSymptomsInput = document.getElementById('currentSymptoms');
    if (currentSymptomsInput) currentSymptomsInput.value = data.currentSymptoms || '';
    
    const firstVisitInput = document.getElementById('initialVisitDateWestern');
    if (firstVisitInput) firstVisitInput.value = data.firstVisit || '';
    
    const symptomsTextarea = document.querySelector('textarea[placeholder="具体的な症状を記載してください"]');
    if (symptomsTextarea) symptomsTextarea.value = data.symptoms || '';
    
    const treatmentTextarea = document.querySelector('textarea[placeholder="通院频度、治療内容など"]');
    if (treatmentTextarea) treatmentTextarea.value = data.treatment || '';
    
    const medicationTextarea = document.querySelector('textarea[placeholder="服用中の薬剤名、用量など"]');
    if (medicationTextarea) medicationTextarea.value = data.medication || '';
    
    const dailyLifeTextarea = document.querySelector('textarea[placeholder="食事、入浴、外出等への影響"]');
    if (dailyLifeTextarea) dailyLifeTextarea.value = data.dailyLife || '';
    
    const workTextarea = document.querySelector('textarea[placeholder="就労状況、業務への影響など"]');
    if (workTextarea) workTextarea.value = data.work || '';
}

// Populate family members
function populateFamilyMembers(familyMembers) {
    const spouse = familyMembers.find(m => m.memberType === 'spouse');
    const children = familyMembers.filter(m => m.memberType === 'child');
    
    // Populate spouse
    if (spouse) {
        const spouseYesRadio = document.querySelector('input[name="hasSpouse"][value="true"]');
        if (spouseYesRadio) {
            spouseYesRadio.checked = true;
            spouseYesRadio.dispatchEvent(new Event('change'));
        }
        
        setTimeout(() => {
            const spouseInputs = document.getElementById('spouseInfo').querySelectorAll('input');
            if (spouseInputs.length >= 5) {
                spouseInputs[0].value = spouse.name || '';
                spouseInputs[1].value = spouse.nameKana || '';
                spouseInputs[2].value = spouse.myNumber || '';
                spouseInputs[3].value = spouse.basicPensionNumber || '';
                spouseInputs[4].value = spouse.birthDate || '';
            }
        }, 100);
    }
    
    // Populate children
    children.forEach((child, index) => {
        // Add child form
        if (typeof addChild === 'function') {
            addChild();
            
            setTimeout(() => {
                const childCards = document.getElementById('childrenList').querySelectorAll('.border.border-notion-gray-200');
                const lastCard = childCards[childCards.length - 1];
                
                if (lastCard) {
                    const inputs = lastCard.querySelectorAll('input');
                    if (inputs.length >= 4) {
                        inputs[0].value = child.name || '';
                        inputs[1].value = child.nameKana || '';
                        inputs[2].value = child.myNumber || '';
                        inputs[3].value = child.birthDate || '';
                    }
                }
            }, 100 * (index + 1));
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white transition-all duration-300 z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const applicationId = urlParams.get('edit');
    
    if (applicationId && applicationId !== 'new') {
        loadApplication(applicationId);
    }
});