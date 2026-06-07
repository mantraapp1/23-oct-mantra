import https from 'https';

const SUPABASE_URL = 'https://hiposzbsobvhkgylmeyy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpcG9zemJzb2J2aGtneWxtZXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5OTg4MzksImV4cCI6MjA3NzU3NDgzOX0.w1T1BsuwIBdnzAmNpZJUHOOkwKWJ84i4jo_wXlJtwIU';

function makeRequest(urlPath, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: {
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        };

        const req = https.request(`${SUPABASE_URL}${urlPath}`, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        raw: data,
                        error: e.message
                    });
                }
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function run() {
    try {
        console.log('--- Checking Novels ---');
        const novels = await makeRequest('/rest/v1/novels?select=id,title,total_votes&id=eq.389d6b6a-f031-42f9-8ab9-ff5c850a9a4a');
        console.log('Novels data:', JSON.stringify(novels.data, null, 2));

        console.log('--- Checking Votes ---');
        const votes = await makeRequest('/rest/v1/novel_votes?select=*&novel_id=eq.389d6b6a-f031-42f9-8ab9-ff5c850a9a4a');
        console.log('Votes in table:', JSON.stringify(votes.data, null, 2));
    } catch (err) {
        console.error(err);
    }
}

run();
