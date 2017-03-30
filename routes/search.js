"use strict";
const amazon = require('amazon-product-api');
const express = require('express');
// const rand1 = require('random-seed').create(seed),
// const rand = require('random-seed').create(seed);

const searchRouter  = express.Router();
const client = amazon.createClient({
  awsId: process.env.AWS_ID,
  awsSecret:process.env.AWS_SECRET,
  awsTag:process.env.AWS_TAG
});

const amzSearch = function(brand, category) {
  const results = client.itemSearch({
    brand: brand,
    // keywords: 'television',
    title: category,
    ItemPage: 1,
    sort: 'salesrank',
    searchIndex: 'Electronics',
    responseGroup: 'ItemAttributes,Images'
  })
    return results;
}

module.exports = (knex) => {

  searchRouter.get("/", (req, res) => {
    const rand1 = Math.floor(Math.random() * 5);
    const rand2 = Math.floor(Math.random() * 5);
    const rand3 = Math.floor(Math.random() * 2);
    const rand4 = Math.floor(Math.random() * 2);
    console.log(req.query.brand1, req.query.brand2);
    Promise.all([
      amzSearch(req.query.brand1, req.query.category),
      amzSearch(req.query.brand2, req.query.category)
    ])
    .then(function(results) {
      const pro1 = {
        title: results[rand3][rand1].ItemAttributes[0].Title,
        type:  results[rand3][rand1].ItemAttributes[0].ProductTypeName
      }
      const pro2 = {
        title: results[rand4][rand2].ItemAttributes[0].Title,
        type:  results[rand4][rand2].ItemAttributes[0].ProductTypeName
      }
      console.log('pro1 type: ' + pro1.type);
      console.log('pro2 type: ' + pro2.type);
      return knex
        .select('*')
        .from('comparisons')
        .where({
          product_one: pro1.title[0],
          product_two: pro2.title[0]
        })
        .orWhere({
          product_one: pro2.title[0],
          product_two: pro1.title[0]
        })
        .then(function(result) {
          console.log(result);
          if(result.length === 0 && pro1.type[0] === pro2.type[0] && pro1.title[0] !== pro2.title[0]) {
            return knex
              .insert({product_one: pro1.title[0], product_two: pro2.title[0]}).into('comparisons')
              .then(function(result) {
                // console.log(pro1.type);
                // return result;
                const productTitles = {
                    pro1: results[rand3][rand1].ItemAttributes[0].Title,
                    pro2: results[rand4][rand2].ItemAttributes[0].Title
                  };
                // console.log(results[0][rand1])
                let templateVars = {
                  br1: {
                    image1: results[rand3][rand1].LargeImage[0].URL,
                    brand1: results[rand3][rand1].ItemAttributes[0].Brand,
                    ProductType1: results[rand3][rand1].ItemAttributes[0].ProductTypeName,
                    DetailPageURL1: results[rand3][rand1].DetailPageURL,
                    pTitle1: results[rand3][rand1].ItemAttributes[0].Title,
                    description: results[rand3][rand1].ItemAttributes[0].Feature,
                  },
                  br2: {
                    image2: results[rand4][rand2].LargeImage[0].URL,
                    brand2: results[rand4][rand2].ItemAttributes[0].Brand,
                    ProductType2: results[rand4][rand2].ItemAttributes[0].ProductTypeName,
                    DetailPageURL2: results[rand4][rand2].DetailPageURL,
                    pTitle2: results[rand4][rand2].ItemAttributes[0].Title,
                    description: results[rand4][rand2].ItemAttributes[0].Feature
                  }
                }
                res.render("searchres", templateVars);
              })
          } else if (pro1.title[0] !== pro2.title){
              const productTitles = {
                pro1: results[rand3][rand1].ItemAttributes[0].Title,
                pro2: results[rand4][rand2].ItemAttributes[0].Title
              };
                  // console.log(results[0][rand1])
              let templateVars = {
                br1: {
                  image1: results[rand3][rand1].LargeImage[0].URL,
                  brand1: results[rand3][rand1].ItemAttributes[0].Brand,
                  ProductType1: results[rand3][rand1].ItemAttributes[0].ProductTypeName,
                  DetailPageURL1: results[rand3][rand1].DetailPageURL,
                  pTitle1: results[rand3][rand1].ItemAttributes[0].Title,
                  description: results[rand3][rand1].ItemAttributes[0].Feature,
                },
                br2: {
                  image2: results[rand4][rand2].LargeImage[0].URL,
                  brand2: results[rand4][rand2].ItemAttributes[0].Brand,
                  ProductType2: results[rand4][rand2].ItemAttributes[0].ProductTypeName,
                  DetailPageURL2: results[rand4][rand2].DetailPageURL,
                  pTitle2: results[rand4][rand2].ItemAttributes[0].Title,
                  description: results[rand4][rand2].ItemAttributes[0].Feature
                }
             }
            res.render("searchres", templateVars);
          }

          return null;
        })
        // return results;
    })
    .catch(function(err){
      console.log('ERROR', err);
      res.render("indexError")
    });
  });

  searchRouter.post('/', (req, res) => {
    console.log('voted pro is: ' +req.body.votedPro, 'unvoted pro is: ' + req.body.unvotedPro);
    const votedPro   = req.body.votedPro;
    const unvotedPro = req.body.unvotedPro;
    const user = req.session.user;
    console.log('user is : ' + user);
    knex.select('*')
        .from('comparisons')
        .where({
          product_one: votedPro,
          product_two: unvotedPro
        })
        .orWhere({
          product_one: unvotedPro,
          product_two: votedPro
        })
        .then(function(result) {
          console.log(result);
          console.log(result[0].id);
          console.log(result[0].product_one);
          if(result.length > 0) {
            if(result[0].product_one === votedPro) {
              const currentVotes = result[0].product_one_votes;
              knex('comparisons')
                .where('id', '=', result[0].id)
                .update({
                  product_one_votes: currentVotes + 1
                })
              .then(function(voteCount) {
                // console.log(voteCount);
              })
            }
          }
          return result;
        }) .catch(function(err) {
              console.log(err);
            })
        .then(function(result) {
          console.log('this should be the comparison row: '+ result[0].product_one);
          return knex.select('*')
                  .from('users')
                  .where('email', '=', user)
                  .then(function(userRow) {
                    console.log('user id: ' + userRow[0].id);
                    console.log('comparison row id: ' + result[0].id);
                    knex.insert({
                      user_id: userRow[0].id,
                      comparisons_id: result[0].id
                    }).into('votes')
                    .then(function(result) {
                      console.log(result);
                    }).catch(function(err) {
                      console.log(err);
                    })
                  })
                  .catch(function(err) {
                    console.log(err);
                  })
        })
    .catch(function(err) {
      console.log(err);
    });

    //     .then(function(result) {
    //       knex.insert({
    //         user_id: user,
    //         comparisons_id:
    //       })
    //       .into('votes')
    //     })

  })

  return searchRouter
};
