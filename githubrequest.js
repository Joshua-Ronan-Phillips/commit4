var https = require('https');
var qs = require('querystring');
var env = require('env2')('./config.env');


var githubHandler = function(req, res) {
  var query = req.url.split('/');
  var owner = query[2];
  var repo = query[3];
  var credentials = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET
  };
  var options = {
    host: 'api.github.com',
    method: 'GET',
    path: '/repos/'+owner+'/'+repo+'/commits?' + qs.stringify(credentials),
    headers: {
      'User-agent': 'commit4'
    }
  };
  var commitHistory = {};
  var i = 0;
  var requestCommitHistory = https.request(options, getCommitsfromHistory);

  requestCommitHistory.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  requestCommitHistory.end();

  function getCommitsfromHistory(unparsedCommitHistory) {
    parseBody(unparsedCommitHistory, function(arrayOfCommits) {
      JSON.parse(arrayOfCommits).forEach(addCommitToHistoryObject);
    });
  }

  function addCommitToHistoryObject(commit) {
    commitHistory[commit.commit.committer.date] = {
      author: {
        username: commit.committer.login,
        avatar: commit.committer.avatar_url
      },
      files: [],
      sha: commit.sha,
      date: commit.commit.committer.date
    };

    options.path = '/repos/'+owner+'/'+repo+'/commits/' + commit.sha + '?' + qs.stringify(credentials);

    var getCommitDetails = https.request(options, function(unparsedFileArray) {
      addCommitFilesToHistoryObject(unparsedFileArray, commit);
    });
    getCommitDetails.end();
  }

  function addCommitFilesToHistoryObject(unparsedFileArray, commit) {

    parseBody(unparsedFileArray, function(parsedFileArray) {
      commitHistory[commit.commit.committer.date].files = JSON.parse(parsedFileArray).files;
      if (++i === Object.keys(commitHistory).length) {
        res.writeHead(200, {
          "Content-Type": "application/json"
        });
        res.end(JSON.stringify(commitHistory));
      }
    });
  }

  function parseBody(object, callback) {
    var body = '';
    object.setEncoding('utf8');
    object.on('data', function(chunk) {
      body += chunk;
    });
    object.on('end', function() {
      callback(body);
    });
  }

};


var sampleRequest = {
  url:'/commit4/kat4/commit4'
};

var sampleRes = {
  writeHead: function(a,b){},
  end: console.log
};


// githubHandler(sampleRequest,sampleRes);


module.exports = githubHandler;
