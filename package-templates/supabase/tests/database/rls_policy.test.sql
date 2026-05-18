begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

-- Replace these IDs with deterministic users from your local seed data.
select set_config('app.test_user_a', '00000000-0000-0000-0000-000000000001', true);
select set_config('app.test_user_b', '00000000-0000-0000-0000-000000000002', true);

-- Replace app_items / owner_id with your RLS-protected table and owner column.
-- The helper blocks below simulate authenticated users through JWT claims.

select lives_ok(
  $$
    select set_config('request.jwt.claim.role', 'authenticated', true);
    select set_config('request.jwt.claim.sub', current_setting('app.test_user_a'), true);
  $$,
  'can set authenticated claims for user A'
);

select isnt_empty(
  $$
    select id
    from app_items
    where owner_id = current_setting('app.test_user_a')::uuid
  $$,
  'user A can read own rows'
);

select is_empty(
  $$
    select id
    from app_items
    where owner_id = current_setting('app.test_user_b')::uuid
  $$,
  'user A cannot read user B rows'
);

select lives_ok(
  $$
    update app_items
    set updated_at = updated_at
    where owner_id = current_setting('app.test_user_a')::uuid
  $$,
  'user A can update own rows'
);

select results_eq(
  $$
    update app_items
    set updated_at = updated_at
    where owner_id = current_setting('app.test_user_b')::uuid
    returning id
  $$,
  $$ values (null::uuid) limit 0 $$,
  'user A cannot update user B rows'
);

select throws_ok(
  $$
    insert into app_items (owner_id)
    values (current_setting('app.test_user_b')::uuid)
  $$,
  null,
  'user A cannot create a row owned by user B'
);

select * from finish();

rollback;
