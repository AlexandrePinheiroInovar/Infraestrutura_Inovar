// Firebase Services - Sistema MDU
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    where,
    serverTimestamp 
} from 'firebase/firestore';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { auth, db } from './firebase-config.js';

// ================================
// AUTENTICAÇÃO
// ================================

export const authService = {
    // Registrar usuário
    async register(email, password, userData = {}) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Salvar dados adicionais do usuário no Firestore
            await addDoc(collection(db, 'users'), {
                uid: user.uid,
                email: user.email,
                ...userData,
                createdAt: serverTimestamp()
            });
            
            return { success: true, user };
        } catch (error) {
            console.error('Erro no registro:', error);
            return { success: false, error: error.message };
        }
    },

    // Login
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: error.message };
        }
    },

    // Logout
    async logout() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Erro no logout:', error);
            return { success: false, error: error.message };
        }
    },

    // Observer de autenticação
    onAuthStateChange(callback) {
        return onAuthStateChanged(auth, callback);
    }
};

// ================================
// GERENCIAMENTO DE ENDEREÇOS
// ================================

export const enderecosService = {
    // Obter todos os endereços
    async getAll() {
        try {
            const q = query(collection(db, 'enderecos'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const enderecos = [];
            
            querySnapshot.forEach((doc) => {
                enderecos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: enderecos };
        } catch (error) {
            console.error('Erro ao buscar endereços:', error);
            return { success: false, error: error.message };
        }
    },

    // Adicionar endereço
    async add(endereco) {
        try {
            const docRef = await addDoc(collection(db, 'enderecos'), {
                ...endereco,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Erro ao adicionar endereço:', error);
            return { success: false, error: error.message };
        }
    },

    // Atualizar endereço
    async update(id, endereco) {
        try {
            const docRef = doc(db, 'enderecos', id);
            await updateDoc(docRef, {
                ...endereco,
                updatedAt: serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao atualizar endereço:', error);
            return { success: false, error: error.message };
        }
    },

    // Deletar endereço
    async delete(id) {
        try {
            await deleteDoc(doc(db, 'enderecos', id));
            return { success: true };
        } catch (error) {
            console.error('Erro ao deletar endereço:', error);
            return { success: false, error: error.message };
        }
    },

    // Buscar por filtros
    async search(filters = {}) {
        try {
            let q = collection(db, 'enderecos');
            
            // Aplicar filtros
            if (filters.cidade) {
                q = query(q, where('cidade', '==', filters.cidade));
            }
            if (filters.projeto) {
                q = query(q, where('projeto', '==', filters.projeto));
            }
            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            }
            
            q = query(q, orderBy('createdAt', 'desc'));
            
            const querySnapshot = await getDocs(q);
            const enderecos = [];
            
            querySnapshot.forEach((doc) => {
                enderecos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: enderecos };
        } catch (error) {
            console.error('Erro na busca:', error);
            return { success: false, error: error.message };
        }
    }
};

// ================================
// GERENCIAMENTO DE DADOS DE GESTÃO
// ================================

export const gestaoService = {
    // Obter dados de gestão
    async get() {
        try {
            const querySnapshot = await getDocs(collection(db, 'gestao'));
            const gestaoData = {
                projetos: [],
                subprojetos: [],
                supervisores: [],
                equipes: [],
                cidades: []
            };
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                gestaoData[doc.id] = data.items || [];
            });
            
            return { success: true, data: gestaoData };
        } catch (error) {
            console.error('Erro ao buscar dados de gestão:', error);
            return { success: false, error: error.message };
        }
    },

    // Salvar dados de gestão
    async save(type, items) {
        try {
            const docRef = doc(db, 'gestao', type);
            await updateDoc(docRef, {
                items: items,
                updatedAt: serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            // Se documento não existir, criar
            try {
                await addDoc(collection(db, 'gestao'), {
                    type: type,
                    items: items,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                return { success: true };
            } catch (createError) {
                console.error('Erro ao salvar dados de gestão:', createError);
                return { success: false, error: createError.message };
            }
        }
    }
};

// ================================
// ESTATÍSTICAS E DASHBOARD
// ================================

export const statsService = {
    // Obter estatísticas do dashboard
    async getStats() {
        try {
            const enderecos = await enderecosService.getAll();
            
            if (!enderecos.success) {
                return enderecos;
            }
            
            const data = enderecos.data;
            const stats = {
                total: data.length,
                porStatus: {},
                porCidade: {},
                porProjeto: {},
                recentes: data.slice(0, 10)
            };
            
            data.forEach(endereco => {
                // Status
                const status = endereco.status || 'Não definido';
                stats.porStatus[status] = (stats.porStatus[status] || 0) + 1;
                
                // Cidade
                const cidade = endereco.cidade || 'Não definida';
                stats.porCidade[cidade] = (stats.porCidade[cidade] || 0) + 1;
                
                // Projeto
                const projeto = endereco.projeto || 'Não definido';
                stats.porProjeto[projeto] = (stats.porProjeto[projeto] || 0) + 1;
            });
            
            return { success: true, data: stats };
        } catch (error) {
            console.error('Erro ao calcular estatísticas:', error);
            return { success: false, error: error.message };
        }
    }
};

// ================================
// IMPORT/EXPORT
// ================================

export const importExportService = {
    // Importar dados em lote
    async importBatch(enderecos) {
        try {
            const batch = [];
            
            for (const endereco of enderecos) {
                const result = await enderecosService.add(endereco);
                if (result.success) {
                    batch.push(result.id);
                }
            }
            
            return { success: true, imported: batch.length };
        } catch (error) {
            console.error('Erro na importação:', error);
            return { success: false, error: error.message };
        }
    }
};