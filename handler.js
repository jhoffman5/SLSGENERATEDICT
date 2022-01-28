"use strict";
var fs = require('fs');
var readline = require('readline');

const { GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3')
const client = new S3Client() // Pass in opts to S3 if necessary
const bucket = "w3.hoffmanjoshua.net";
const dictFile = "wordl/dictionaryTree.json";
const allWordsFile = "wordl/allWords.txt";
const guessWordsFile = "wordl/guessWords.txt";

module.exports.generateTree = async (event) => {
  try{
    var lengthTree = event.pathParameters.length;

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Dictionary successfully generated!",
          input: event
        },
        null,
        2
      ),
    };
  } catch(e)
  {
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: "Internal Server Error: " + e.message,
          input: event
        },
        null,
        2
      )
    };
  }
};

function getObject (Bucket, Key) {
  return new Promise(async (resolve, reject) => {
    const getObjectCommand = new GetObjectCommand({ Bucket, Key });

    try {
      const response = await client.send(getObjectCommand);
  
      // Store all of data chunks returned from the response data stream 
      // into an array then use Array#join() to use the returned contents as a String
      let responseDataChunks = [];

      // Handle an error while streaming the response body
      response.Body.once('error', err => reject(err));
  
      // Attach a 'data' listener to add the chunks of data to our array
      // Each chunk is a Buffer instance
      response.Body.on('data', chunk => responseDataChunks.push(chunk));
  
      // Once the stream has no more data, join the chunks into a string and return the string
      response.Body.once('end', () => resolve(responseDataChunks.join('')));
    } catch (err) {
      // Handle the error or throw
      return reject(err)
    } 
  })
};

function putObject (Bucket, Key, Body) {
  return new Promise(async (resolve, reject) => {
    const putObjectCommand = new PutObjectCommand({ Bucket, Key, Body});

    try {
      const response = await client.send(putObjectCommand);
      return resolve();
    } catch (err) {
      // Handle the error or throw
      return reject(err);
    } 
  });
};

module.exports.generateDictTxtFileByLength = async (event) => {
  try{
    var length = event.pathParameters.length;
    
    if(parseInt(length))
    {
      var words = "";

      const file = readline.createInterface({
        input: fs.createReadStream("allWords.txt"),
        output: process.stdout,
        terminal: false
      });
      
      file.on('line', (line) => {
        line = line.trim();
        if(line.length == length)
        {
          words += line + "\n";
        }
      });
    
      file.on('close', async function() {
        var response = await putObject(bucket, `wordl/${length}letterwords.txt`, words)
      })

      return {
        statusCode: 200,
        body: JSON.stringify(
          {
            message: "Dictionary text file successfully generated!",
            input: event
          },
          null,
          2
        ),
      };
    }
  } catch (e)
  {
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: "Internal Server Error: " + e.message,
          input: event
        },
        null,
        2
      )
    };
  }
};