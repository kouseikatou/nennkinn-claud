// Projects list management
const ProjectsList = {

    // Initialize the projects list
    async init() {
        // 開発環境で認証をスキップ
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            DevAuth.skipAuth();
        }
        
        await this.loadProjects();
    },

    // Load projects from API
    async loadProjects(params = {}) {
        const projectsContainer = document.getElementById('projects-container');
        if (!projectsContainer) return;
        
        // Show loading state
        projectsContainer.innerHTML = `
            <div class="p-8 text-center text-notion-gray-500">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-linear-blue-600 mx-auto mb-4"></div>
                <p>申請データを読み込み中...</p>
            </div>
        `;
        
        try {
            const result = await ApplicationAPI.getApplications(params);
            const applications = result.applications || [];
            this.renderProjects(applications);
            console.log('✅ APIからデータを取得しました', applications.length + '件');
        } catch (error) {
            console.error('❌ API接続に失敗しました:', error.message);
            projectsContainer.innerHTML = `
                <div class="p-8 text-center text-notion-gray-500">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <p class="text-lg font-medium text-notion-gray-800 mb-2">データの読み込みに失敗しました</p>
                    <p class="text-sm text-notion-gray-500 mb-4">${error.message}</p>
                    <button onclick="ProjectsList.loadProjects()" class="px-4 py-2 bg-linear-blue-600 text-white rounded-lg hover:bg-linear-blue-700 transition-colors">
                        再試行
                    </button>
                </div>
            `;
        }
    },

    // Render projects list
    renderProjects(applications) {
        const projectsContainer = document.getElementById('projects-container');
        if (!projectsContainer) return;

        // Clear existing content
        projectsContainer.innerHTML = '';
        projectsContainer.className = 'bg-white rounded-xl border border-notion-gray-200 overflow-hidden shadow-sm';

        // Render each application
        applications.forEach(app => {
            const projectCard = this.createProjectCard(app);
            projectsContainer.appendChild(projectCard);
        });

        // Update filter tabs
        this.updateFilterTabs(applications);
    },

    // Update filter tabs with counts
    updateFilterTabs(applications) {
        const filterTabs = document.getElementById('filter-tabs');
        if (!filterTabs) return;

        const statusCounts = {
            all: applications.length,
            under_review: 0,
            approved: 0,
            draft: 0,
            rejected: 0
        };

        applications.forEach(app => {
            if (statusCounts[app.status] !== undefined) {
                statusCounts[app.status]++;
            }
        });

        filterTabs.innerHTML = `
            <button class="px-4 py-2 text-sm font-medium rounded-lg bg-linear-blue-500 text-white shadow-sm transition-all duration-200" data-filter="all">
                すべて (${statusCounts.all})
            </button>
            <button class="px-4 py-2 text-sm font-medium rounded-lg text-notion-gray-600 hover:bg-notion-gray-100 transition-all duration-200" data-filter="under_review">
                審査中 (${statusCounts.under_review})
            </button>
            <button class="px-4 py-2 text-sm font-medium rounded-lg text-notion-gray-600 hover:bg-notion-gray-100 transition-all duration-200" data-filter="approved">
                承認済み (${statusCounts.approved})
            </button>
            <button class="px-4 py-2 text-sm font-medium rounded-lg text-notion-gray-600 hover:bg-notion-gray-100 transition-all duration-200" data-filter="draft">
                下書き (${statusCounts.draft})
            </button>
        `;

        // Add click handlers for filter tabs
        filterTabs.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterByStatus(filter);
                
                // Update active state
                filterTabs.querySelectorAll('button').forEach(btn => {
                    btn.className = 'px-4 py-2 text-sm font-medium rounded-lg text-notion-gray-600 hover:bg-notion-gray-100 transition-all duration-200';
                });
                e.target.className = 'px-4 py-2 text-sm font-medium rounded-lg bg-linear-blue-500 text-white shadow-sm transition-all duration-200';
            });
        });
    },

    // Filter applications by status
    async filterByStatus(status) {
        const params = {};
        if (status !== 'all') {
            params.status = status;
        }
        await this.loadProjects(params);
    },

    // Create project card element
    createProjectCard(application) {
        const card = document.createElement('div');
        card.className = 'p-6 border-b border-notion-gray-100 hover:bg-notion-gray-50 transition-all duration-200 cursor-pointer';

        // Get family composition
        const familyComposition = this.getFamilyComposition(application.familyMembers || []);

        // Get status badge and color
        const statusInfo = this.getStatusInfo(application.status);
        
        // Get initial from name
        const nameInitial = application.applicantName ? application.applicantName.charAt(0) : '？';
        
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 ${statusInfo.avatarColor} rounded-xl flex items-center justify-center">
                        <span class="${statusInfo.avatarTextColor} font-semibold">${nameInitial}</span>
                    </div>
                    <div>
                        <h3 class="text-lg font-medium text-notion-gray-800">${application.applicantName || '未設定'}</h3>
                        <p class="text-sm text-notion-gray-600">ID: ${application.applicationNumber || 'APP-' + String(application.id).padStart(3, '0')}</p>
                        <p class="text-xs text-notion-gray-500">作成日: ${this.formatDate(application.createdAt)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.badgeClass}">
                        ${statusInfo.text}
                    </span>
                    <p class="text-xs text-notion-gray-500 mt-1">障害等級: ${application.disabilityGrade ? application.disabilityGrade + '級' : '未定'}</p>
                </div>
            </div>
        `;

        // Add click handler to card
        card.addEventListener('click', (e) => {
            openApplication(application.id);
        });

        return card;
    },

    // Get family composition string
    getFamilyComposition(familyMembers) {
        if (!familyMembers || familyMembers.length === 0) {
            return '配偶者無・子0名';
        }

        const spouse = familyMembers.find(m => m.memberType === 'spouse');
        const children = familyMembers.filter(m => m.memberType === 'child');

        const spouseText = spouse ? '配偶者有' : '配偶者無';
        const childrenText = `子${children.length}名`;

        return `${spouseText}・${childrenText}`;
    },

    // Get status information with colors and styling
    getStatusInfo(status) {
        const statusMap = {
            'draft': { 
                text: '下書き', 
                badgeClass: 'bg-gray-100 text-gray-800',
                avatarColor: 'bg-gray-100',
                avatarTextColor: 'text-gray-600'
            },
            'submitted': { 
                text: '提出済み', 
                badgeClass: 'bg-blue-100 text-blue-800',
                avatarColor: 'bg-blue-100',
                avatarTextColor: 'text-blue-600'
            },
            'under_review': { 
                text: '審査中', 
                badgeClass: 'bg-orange-100 text-orange-800',
                avatarColor: 'bg-orange-100',
                avatarTextColor: 'text-orange-600'
            },
            'additional_docs_required': { 
                text: '追加書類要求', 
                badgeClass: 'bg-yellow-100 text-yellow-800',
                avatarColor: 'bg-yellow-100',
                avatarTextColor: 'text-yellow-600'
            },
            'approved': { 
                text: '承認済み', 
                badgeClass: 'bg-green-100 text-green-800',
                avatarColor: 'bg-green-100',
                avatarTextColor: 'text-green-600'
            },
            'rejected': { 
                text: '却下', 
                badgeClass: 'bg-red-100 text-red-800',
                avatarColor: 'bg-red-100',
                avatarTextColor: 'text-red-600'
            },
            'withdrawn': { 
                text: '取下げ', 
                badgeClass: 'bg-gray-100 text-gray-800',
                avatarColor: 'bg-gray-100',
                avatarTextColor: 'text-gray-600'
            }
        };

        return statusMap[status] || statusMap['draft'];
    },

    // Get status badge HTML (for backwards compatibility)
    getStatusBadge(status) {
        const statusInfo = this.getStatusInfo(status);
        return `<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${statusInfo.badgeClass}">${statusInfo.text}</span>`;
    },

    // Get pension type display name
    getPensionType(applicationType) {
        const typeMap = {
            'new': '新規申請',
            'renewal': '更新申請',
            'grade_change': '等級変更',
            'appeal': '不服申立て'
        };
        return typeMap[applicationType] || '未設定';
    },

    // Format date
    formatDate(dateString) {
        if (!dateString) return '未設定';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    },

    // Format currency
    formatCurrency(amount) {
        if (!amount) return '未設定';
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            maximumFractionDigits: 0
        }).format(amount);
    }
};

// Global variable to store current application ID for modal
let currentApplicationId = null;

// Action handlers
function viewApplication(id) {
    window.location.href = `project-unified.html?view=${id}`;
}

function editApplication(id) {
    window.location.href = `project-unified.html?edit=${id}`;
}


// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', handleSearch);
    }
}

async function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    
    const searchTerm = searchInput?.value || '';
    const statusFilter_value = statusFilter?.value || '';

    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (statusFilter_value) params.status = statusFilter_value;

    await ProjectsList.loadProjects(params);
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the projects page
    if (window.location.pathname.includes('projects.html') || document.getElementById('projects-container')) {
        ProjectsList.init();
        setupSearch();
    }
});