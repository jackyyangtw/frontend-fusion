import Cookie from "js-cookie";

export const state = () => ({
    // isManager: false,
    userData: null,
    userPosts: [],
})

export const mutations = {
    setUserData(state, userData) {
        state.userData = userData;
    },
    setUserPosts(state, userPosts) {
        state.userPosts = userPosts;
    },
    addUserPost(state, userPost) {
        state.userPosts.push(userPost);
    },
    deleteUserPost(state, deletePost) {
        const deletedIndex = state.userPosts.findIndex(
            post => post.id === deletePost
        );
        state.userPosts.splice(deletedIndex, 1);
    },
    setIsManager(state, isManager) {
        state.isManager = isManager;
    },
    editUserPost(state, editedPost) {
        const postIndex = state.userPosts.findIndex(
            post => post.id === editedPost.id
        );
        state.userPosts[postIndex] = editedPost;
    },
}

export const actions = {
    async setUserData(vuexContext) {
        const userDataString = Cookie.get('userData');
        if (!userDataString) {
            vuexContext.commit("setUserData", {});
            return;
        }

        const userData = JSON.parse(userDataString);
        const { data: dbUserData } = await this.$axios.get(`/users/${userData.id}.json`);
        const isManager = dbUserData?.isManager;
        vuexContext.commit("setUserData", { ...userData, isManager });
    },
    async setUserPosts(vuexContext) {
        const userDataString = Cookie.get('userData');
        if (!userDataString) return;

        const userId = JSON.parse(userDataString)?.id;
        if (!userId) return;

        const userPosts = await this.$axios.$get(`/posts.json`);
        const filteredPosts = Object.values(userPosts).filter(post => post.userId === userId);
        vuexContext.commit("setUserPosts", filteredPosts);
    },
    async updateUserPhoto(vuexContext, photo) {
        const storageRef = this.$storage.ref();
        const { id: uid } = vuexContext.state.userData;
        const stickerRef = storageRef.child(`user-sticker/${uid}`);
        try {
            await stickerRef.put(photo);
            const token = vuexContext.rootState.token;
            const url = await stickerRef.getDownloadURL();
            const updatedData = { ...vuexContext.state.userData, photoURL: url };
            await this.$axios.$put(`/users/${uid}.json?auth=${token}`, updatedData);
            vuexContext.commit("setUserData", updatedData);
            Cookie.set('userData', JSON.stringify(updatedData));
        } catch (error) {
            console.error(error);
        }
    }
}

export const getters = {
    userData(state) {
        return state.userData;
    },
    userPosts(state) {
        return state.userPosts;
    },
    isManager(state) {
        return state.userData?.isManager;
    }
}

