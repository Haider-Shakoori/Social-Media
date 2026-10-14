import assert from 'node:assert/strict';
import test from 'node:test';
import {assertInstagramPilotEnabled,permittedInstagramResource} from '../instagram-pilot';

test('human-assisted Instagram pilot is opt-in and single-session only',()=>{
 const good={INSTAGRAM_PILOT_ENABLED:'true',BROWSER_LAB_MAX_SESSIONS:'1',DISPLAY:':98'};
 assert.doesNotThrow(()=>assertInstagramPilotEnabled(good));
 for(const env of [{},{...good,BROWSER_LAB_MAX_SESSIONS:'2'},
  {...good,INSTAGRAM_PILOT_ENABLED:'false'}, {...good,DISPLAY:''},
  {...good,INSTAGRAM_PILOT_PUBLISHING_ENABLED:'true'},
  {...good,BROWSER_LAB_ALLOW_SOCIAL_LOGIN:'true'}]){
  assert.throws(()=>assertInstagramPilotEnabled(env));
 }
});
test('only Instagram and first-party Meta HTTPS hosts pass',()=>{
 for(const url of ['https://www.instagram.com/accounts/login/','https://static.cdninstagram.com/abc',
  'https://scontent.cdninstagram.com/p','https://www.facebook.com/','https://connect.facebook.com/',
  'https://scontent.fbcdn.net/a','data:image/png;base64,AQ==','blob:https://www.instagram.com/test'])
  assert.equal(permittedInstagramResource(url),true,url);
 for(const url of ['https://instagram.com.attacker.test/','https://fakeinstagram.com/',
  'http://www.instagram.com/','file:///etc/passwd','https://127.0.0.1:3000/',
  'https://169.254.169.254/latest/meta-data/','https://10.0.0.1/',
  'ftp://instagram.com/','https://user:pass@instagram.com/',
  'https://instagram.com.evil.org/', 'https://evilcdninstagram.com/'])
  assert.equal(permittedInstagramResource(url),false,url);
});
