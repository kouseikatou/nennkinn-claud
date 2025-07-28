        // 委任状フォーム
        function getPowerOfAttorneyForm(selectedApplicant = '', selectedCreator = '') {
            return getGenericDocumentForm('委任状', selectedApplicant, selectedCreator, 'saveGenericDocument', 'power-of-attorney');
        }

        // 委任状（顧客記載なし）フォーム
        function getPowerOfAttorneyBlankForm(selectedApplicant = '', selectedCreator = '') {
            return getGenericDocumentForm('委任状（顧客記載なし）', selectedApplicant, selectedCreator, 'saveGenericDocument', 'power-of-attorney-blank');
        }

        // 年金相談受付表フォーム
        function getPensionConsultationForm(selectedApplicant = '', selectedCreator = '') {
            return getGenericDocumentForm('年金相談受付表', selectedApplicant, selectedCreator, 'saveGenericDocument', 'pension-consultation');
        }

        // 年金生活者支援給付金請求書フォーム
        function getPensionSupportBenefitForm(selectedApplicant = '', selectedCreator = '') {
            return getGenericDocumentForm('年金生活者支援給付金請求書', selectedApplicant, selectedCreator, 'saveGenericDocument', 'pension-support-benefit');
        }

        // 障害基礎年金請求書フォーム
        function getDisabilityBasicPensionForm(selectedApplicant = '', selectedCreator = '') {
            return getGenericDocumentForm('障害基礎年金請求書', selectedApplicant, selectedCreator, 'saveGenericDocument', 'disability-basic-pension');
        }

        // 障害厚生年金請求書フォーム
        function getDisabilityWelfarePensionForm(selectedApplicant = '', selectedCreator = '') {
            return getGenericDocumentForm('障害厚生年金請求書', selectedApplicant, selectedCreator, 'saveGenericDocument', 'disability-welfare-pension');
        }

        // 障害給付請求事由確認書フォーム
        function getDisabilityPaymentConfirmationForm(selectedApplicant = '', selectedCreator = '') {
            return getGenericDocumentForm('障害給付請求事由確認書', selectedApplicant, selectedCreator, 'saveGenericDocument', 'disability-payment-confirmation');
        }

        // 年金裁定請求の遅延に関する申立書フォーム
        function getPensionDelayStatementForm(selectedApplicant = '', selectedCreator = '') {
            return getGenericDocumentForm('年金裁定請求の遅延に関する申立書', selectedApplicant, selectedCreator, 'saveGenericDocument', 'pension-delay-statement');
        }

        // 障害給付加算額・加給年金額加算開始事由該当届フォーム
        function getDisabilityAdditionalBenefitForm(selectedApplicant = '', selectedCreator = '') {
            return getGenericDocumentForm('障害給付加算額・加給年金額加算開始事由該当届', selectedApplicant, selectedCreator, 'saveGenericDocument', 'disability-additional-benefit');
        }

        // 汎用的な書類フォーム
        function getGenericDocumentForm(documentName, selectedApplicant = '', selectedCreator = '', saveFunction = '', documentType = '') {
            return `
                <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-notion-gray-700 mb-2">申請者選択</label>
                            <select class="w-full px-4 py-3 border border-notion-gray-300 rounded-lg focus:ring-2 focus:ring-linear-blue-500 focus:border-transparent outline-none">
                                <option value="">申請者を選択してください</option>
                                <option value="田中太郎" ${selectedApplicant === '田中太郎' ? 'selected' : ''}>田中太郎 (APP-2024-001)</option>
                                <option value="山田花子" ${selectedApplicant === '山田花子' ? 'selected' : ''}>山田花子 (APP-2024-002)</option>
                                <option value="佐藤一郎" ${selectedApplicant === '佐藤一郎' ? 'selected' : ''}>佐藤一郎 (APP-2024-003)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-notion-gray-700 mb-2">作成者</label>
                            <input type="text" class="w-full px-4 py-3 border border-notion-gray-300 rounded-lg focus:ring-2 focus:ring-linear-blue-500 focus:border-transparent outline-none bg-notion-gray-50" value="${selectedCreator}" readonly>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-notion-gray-700 mb-2">作成日</label>
                            <input type="date" class="w-full px-4 py-3 border border-notion-gray-300 rounded-lg focus:ring-2 focus:ring-linear-blue-500 focus:border-transparent outline-none" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-notion-gray-700 mb-2">優先度</label>
                            <select class="w-full px-4 py-3 border border-notion-gray-300 rounded-lg focus:ring-2 focus:ring-linear-blue-500 focus:border-transparent outline-none">
                                <option value="normal">通常</option>
                                <option value="high">高</option>
                                <option value="urgent">緊急</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-notion-gray-700 mb-2">特記事項</label>
                        <textarea class="w-full px-4 py-3 border border-notion-gray-300 rounded-lg focus:ring-2 focus:ring-linear-blue-500 focus:border-transparent outline-none h-24" placeholder="${documentName}作成に関する特記事項があれば記入してください"></textarea>
                    </div>

                    <div class="flex justify-end space-x-4">
                        <button onclick="closeModal()" class="px-6 py-3 border border-notion-gray-300 text-notion-gray-700 rounded-lg hover:bg-notion-gray-50 transition-all duration-200">
                            キャンセル
                        </button>
                        <button onclick="${saveFunction}('${documentType}')" class="px-6 py-3 bg-linear-blue-600 text-white rounded-lg hover:bg-linear-blue-700 transition-all duration-200">
                            作成依頼を保存
                        </button>
                    </div>
                </div>
            `;
        }

        // 汎用保存関数
        function saveGenericDocument(documentType) {
            const modal = document.getElementById('createDocumentModal');
            const formData = {
                applicant: modal.querySelector('select').value,
                creator: modal.querySelectorAll('input[type="text"]')[0].value,
                creationDate: modal.querySelector('input[type="date"]').value,
                priority: modal.querySelectorAll('select')[1].value,
                notes: modal.querySelector('textarea').value,
                documentType: documentType
            };

            // バリデーション
            if (!formData.applicant || formData.applicant === '申請者を選択してください') {
                alert('申請者を選択してください。');
                return;
            }

            // 書類名のマッピング
            const documentNames = {
                'power-of-attorney': '委任状',
                'power-of-attorney-blank': '委任状（顧客記載なし）',
                'pension-consultation': '年金相談受付表',
                'pension-support-benefit': '年金生活者支援給付金請求書',
                'disability-basic-pension': '障害基礎年金請求書',
                'disability-welfare-pension': '障害厚生年金請求書',
                'disability-payment-confirmation': '障害給付請求事由確認書',
                'pension-delay-statement': '年金裁定請求の遅延に関する申立書',
                'disability-additional-benefit': '障害給付加算額・加給年金額加算開始事由該当届'
            };

            // 顧客管理システムにデータを記録
            const customerDocumentData = {
                type: documentType,
                typeName: documentNames[documentType] || documentType,
                date: new Date().toLocaleDateString('ja-JP'),
                creator: formData.creator,
                priority: formData.priority,
                status: 'requested'
            };

            // 顧客管理システムが利用可能な場合のみ連携
            if (typeof window.addDocumentToCustomer === 'function') {
                window.addDocumentToCustomer(formData.applicant, customerDocumentData);
            } else {
                // 顧客管理システムが利用できない場合は、LocalStorageに保存
                saveToLocalStorage('pendingCustomerData', {
                    customerId: formData.applicant,
                    documentData: customerDocumentData
                });
            }
            
            alert(`${documentNames[documentType] || documentType}の作成依頼を顧客管理システムに記録しました。`);
            closeModal();
        }