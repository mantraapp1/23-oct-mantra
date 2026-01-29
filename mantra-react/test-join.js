
import https from 'https';

const SUPABASE_URL = 'https://hiposzbsobvhkgylmeyy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpcG9zemJzb2J2aGtneWxtZXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5OTg4MzksImV4cCI6MjA3NzU3NDgzOX0.w1T1BsuwIBdnzAmNpZJUHOOkwKWJ84i4jo_wXlJtwIU';

function testFetch() {
    console.log('Testing connectivity with JOIN to:', SUPABASE_URL);

    // Test select with author:profiles(*) join
    // URL encoding needs to be correct for PostgREST
    const query = 'select=id,title,author:profiles(id,username,display_name)&limit=5';

    const options = {
        method: 'GET',
        headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        timeout: 10000
    };

    const req = https.request(`${SUPABASE_URL}/rest/v1/novels?${query}`, options, (res) => {
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('Body:', data);
        });
    });

    req.on('error', (e) => {
        console.error('Request Error:', e);
    });

    req.end();
}

testFetch();
