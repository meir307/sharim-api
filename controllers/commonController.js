const express = require('express');
const router = express.Router();
const appCache = require('../services/common/appCache');

/**
 * Initialize application data
 * @route GET /api/common/LoadCache
 * @access Public
 */
const LoadCache = async (req, res) => {
     try {

        const initResponse = {
            su_params: appCache.params
        }

        res.status(200).json(initResponse);
    } catch (error) {
        console.error('Error in LoadCache controller:', error);
        res.status(500).json({ error: error.message || 'Failed to load cache' });
    }
};



module.exports = {
    router,
    LoadCache
}; 


// const demo = async (req, res) => {
//     try {
//            const { name, email } = req.body;

//            if (!name || !email) {
//                return res.status(400).json({ error: 'Name and email are required' });
//            }

//            const newUser = await commonService.createUser(req.body);
//            res.status(201).json(newUser);
//        } catch (error) {
//            console.error('Error in createUser controller:', error);
//            res.status(500).json({ error: error.message || 'Failed to create user' });
//        }
// };