import admin from 'firebase-admin';
import fs from 'fs';


const serviceAccount = JSON.parse(fs.readFileSync('./secrets/whrilapi-firebase.json'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:'https://whrilapi-default-rtdb.firebaseio.com/'
});


const firestoreAdmin = admin.firestore();
const realtimeAdmin = admin.database();


const firestoreDb = {
    getByKey: async (collectionName, fieldName) => {
      try {
        const snapshot = await firestoreAdmin.collection(collectionName).where(fieldName, '!=', null).get();

        if (!snapshot.empty) {
              const data = [];
              snapshot.forEach((doc) => {
              const docData = doc.data();
              data.push({
                  id: `${doc.id}`,
                  data: { ...docData }
              });
              });
              return data;
        } else {
              return null;
        }
      } catch (error) {
          console.error("Error retrieving data: ", error);
      }
    },
    getByKeyValue: async (collectionName, fieldName, fieldValue) => {
        try {
          const snapshot = await firestoreAdmin.collection(collectionName).where(fieldName, "==", fieldValue).get();
    
          if (!snapshot.empty) {
                const data = [];
                snapshot.forEach((doc) => {
                const docData = doc.data();
                data.push({ 
                        id: `${doc.id}`,
                        data: { ...docData} 
                    });
                });
                return data;
          } else {
                return null;
          }
        } catch (error) {
            console.error("Error retrieving data: ", error);
        }
    },  
    batchGet: async (collectionName, documentIds) => {
        try {
          const docRefs = documentIds.map((id) => firestoreAdmin.collection(collectionName).doc(id));
          const snapshots = await firestoreAdmin.getAll(...docRefs);
    
          const data = snapshots.map((snapshot) => {
            if (snapshot.exists) {
                return snapshot.data();
            } else {
              return null;
            }
          });
    
          console.log(data);
          return data;
        } catch (error) {
          console.error("Error retrieving data: ", error);
        }
    },
    getColl: async (collectionName) => {
        try {
            const snapshot = firestoreAdmin.collection(collectionName).get();
        
            if (snapshot.empty) {
                return null;
            } else {
                const items = [];
                snapshot.forEach((doc) => {
                    const item = { 
                        id: doc.id,
                        data: doc.data()
                    };
                    items.push(item);
                });
                return items;
            }
        } catch (error) {
        console.error("Error retrieving data: ", error);
        }
    },
    // Add
    create: async (collectionName, data, docId) => {
        try {
            let docRef;
            if (docId) {
              docRef = firestoreAdmin.collection(collectionName).doc(docId);
            } else {
              docRef = firestoreAdmin.collection(collectionName).doc();
            }
            await docRef.set(data);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    },
    batchCreate: async (collectionName, data, documentIdKey) => {
        try {
          const batch = firestoreAdmin.batch();
          data.forEach(item => {
            let docRef;
            if (documentIdKey && item[documentIdKey]) {
              const id = item[documentIdKey];
              docRef = firestoreAdmin.collection(collectionName).doc(id);
            } else {
              docRef = firestoreAdmin.collection(collectionName).doc();
            }
            batch.set(docRef, item); 
          });
          await batch.commit();
        } catch (error) {
          console.error("Error adding documents: ", error);
        }
    },
    // Update
    update: async (collectionName, data, docId) => {
        try {
            let docRef;
            if (docId) {
              docRef = firestoreAdmin.collection(collectionName).doc(docId);
            } else {
              console.log('Please provide a document id')
            }
            await docRef.set(data);
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    },
    batchupdate: async () => {
        try {
            console.log(`Batch update is in maintanence`);
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    },
    // Delete
    delete: async (collectionName, documentId) => {
        try {
          const docRef = firestoreAdmin.collection(collectionName).doc(documentId);
          const snapshot = await docRef.get();
    
          if (snapshot.exists) {
            await docRef.delete();
          } else {
            console.log("Document does not exist.");
          }
        } catch (error) {
          console.error("Error deleting document: ", error);
        }
    },
    batchDelete: async (collectionName, documentIds) => {
        try {
          const batch = firestoreAdmin.batch(); 
          documentIds.forEach(documentId => {
            const docRef = firestoreAdmin.collection(collectionName).doc(documentId);
            batch.delete(docRef);
          });
          await batch.commit(); 
        } catch (error) {
          console.error("Error deleting documents: ", error);
        }
    },
    deleteColl: async (collectionName) => {
        try {
          const querySnapshot = await firestoreAdmin.collection(collectionName).get();
      
          const batch = firestoreAdmin.batch();
          querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
      
          await batch.commit();
        } catch (error) {
          console.error("Error deleting collection: ", error);
        }
    },
    createDoc: async (collectionPath, documentId, data) => {
        try {
            const docRef = firestoreAdmin.doc(`${collectionPath}/${documentId}`);
            await docRef.set(data);
        } catch (error) {
            console.error(error);
        }
    },
    batchCreateDoc: async (collectionPath, documentIdKey, data) => {
        try {
            const batch = firestoreAdmin.batch();
            data.forEach(item => {
                let docRef;
                if (documentIdKey && item[documentIdKey]) {
                  const id = item[documentIdKey];
                  docRef = firestoreAdmin.collection(collectionPath).doc(id);
                } else {
                  docRef = firestoreAdmin.collection(collectionPath).doc();
                }
                batch.set(docRef, item); 
            });
            await batch.commit();
        } catch (error) {
            console.error("Error adding documents: ", error);
        }
    },
    getDoc: async (collectionPath, documentId) => {
        try {
            const docRef = firestoreAdmin.collection(collectionPath).doc(documentId);
            const snapshot = await docRef.get();

            if (snapshot.exists) {
              const data = snapshot.data();
              return data;
            } else {
              return null;
            }
        } catch (error) {
            console.error('Error retrieving Firestore data:', error);
            throw error;
        }
    },
    getDocIds: async (collectionName) => {
        try {
            const collRef = firestoreAdmin.collection(collectionName);
            const docs = await collRef.listDocuments();
            const docIds = docs.map((document) => document.id);
            return docIds
        } catch (error) {
            console.error(error);
        }
    }
}

const realtimeDb = {
    get: async() => {
        try {
          
        } catch (error) {
          
        }
    }
}


export { firestoreDb, realtimeDb };

