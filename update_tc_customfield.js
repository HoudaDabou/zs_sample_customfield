const https = require('https');
const fs = require('fs');

const baseUrl = 'https://localhost:8080/rest/atm/1.0';
const authToken = 'Basic_authToken';
const projectKey = `projectKey = "AUT"`;

const auth = {
  username: 'username',
  password: 'password'
};

// Function to search for test cases in a project
async function searchTestCases() {
  const url = `${baseUrl}/testcase/search?query=${encodeURIComponent(projectKey)}`;

  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        Authorization: `Basic ${authToken}`
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`Error searching for test cases: ${res.statusMessage}`);
          reject();
        } else {
          const response = JSON.parse(data);
          resolve(response);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Error searching for test cases: ${error}`);
      reject();
    });
  });
}

async function updateCustomField(testCaseKey, customFields) {
  return new Promise((resolve, reject) => {
    try {
      const options = {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        encoding: 'utf-8'
      };

      const req = https.request(`${baseUrl}/testcase/${testCaseKey}`, options, res => {
        if (res.statusCode === 200) {
          console.log(`Custom field updated for test case ${testCaseKey}`);
          resolve(true);
        } else {
          console.error(`Error updating custom field for test case ${testCaseKey}: ${res.statusMessage}`);
          resolve(false);
        }
      });

      req.on('error', error => {
        console.error(`Error updating custom field for test case ${testCaseKey}: ${error}`);
        resolve(false);
      });

      const customFieldsToWrite = {
        customFields: {
          ...customFields,
        },
      };
    
      req.write(JSON.stringify(customFieldsToWrite));

      req.end();

    } catch (error) {
      console.error(`Error updating custom field for test case ${testCaseKey}: ${error}`);
      resolve(false);
    }
  });
}


async function main() {
  try {
    // Search for test cases in project
    const testCases = await searchTestCases();
    if (!testCases) {
      console.error(`Error searching for test cases`);
      return;
    }

    // Write test case keys to file
    const testCaseKeys = testCases.map(testCase => testCase.key);
    const data = JSON.stringify(testCaseKeys);
    fs.writeFile('test-case-keys.json', data, (error) => {
      if (error) {
        console.error(`Error writing test case keys to file: ${error}`);
      } else {
        console.log(`Test case keys written to file test-case-keys.json`);
      }
    });

    // Update custom field for each test case
    for (const testCase of testCases) {
      const customFields = testCase.customFields;
      const customFieldValue = testCase.key;
      const customFieldsToUpdate = {
          ...customFields,
          "original test case key": customFieldValue
      };      

      const success = await updateCustomField(testCase.key, customFieldsToUpdate);

      if (!success) {
        console.log(`Failed to update custom field for test case ${testCase.key}`);
        console.error(`Failed to update custom field for test case ${testCase.key}`);
      }
    }
  } catch (error) {
    console.error(`Error in main function: ${error}`);
  }
}

main();
  