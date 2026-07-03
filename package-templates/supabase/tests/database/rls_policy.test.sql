begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

-- --- 設定変数（環境に合わせて編集 / psql -v で注入）---
-- Edit this block to match your schema, or override at run time with
--   psql -v table_name=<table> -v owner_column=<column> ...
-- The test bodies below are built with format() so the identifier is injected
-- safely. psql expands :'var' to a quoted string literal (the value), and
-- format('%I', ...) turns it into a properly quoted identifier, so reserved
-- words or spaces in a table/column name will not break the query.
-- Note: psql does NOT interpolate :'var' / :"var" inside a dollar-quoted
-- string ($$...$$), so the variables are passed to format() from outside the
-- quoted template text (see PostgreSQL psql "SQL Interpolation").
\set table_name app_items
\set owner_column owner_id
-- Optional: add \set tenant_column <column> and reference it in the format()
-- templates below if your schema is multi-tenant. Left unset here
-- (tenant-independent by default).

-- Replace these IDs with deterministic users from your local seed data.
select set_config('app.test_user_a', '00000000-0000-0000-0000-000000000001', true);
select set_config('app.test_user_b', '00000000-0000-0000-0000-000000000002', true);

-- The helper blocks below simulate authenticated users through JWT claims.

select lives_ok(
  $$
    select set_config('request.jwt.claim.role', 'authenticated', true);
    select set_config('request.jwt.claim.sub', current_setting('app.test_user_a'), true);
  $$,
  'can set authenticated claims for user A'
);

select isnt_empty(
  format(
    $q$
      select id
      from %I
      where %I = current_setting('app.test_user_a')::uuid
    $q$,
    :'table_name', :'owner_column'
  ),
  'user A can read own rows'
);

select is_empty(
  format(
    $q$
      select id
      from %I
      where %I = current_setting('app.test_user_b')::uuid
    $q$,
    :'table_name', :'owner_column'
  ),
  'user A cannot read user B rows'
);

select lives_ok(
  format(
    $q$
      update %I
      set updated_at = updated_at
      where %I = current_setting('app.test_user_a')::uuid
    $q$,
    :'table_name', :'owner_column'
  ),
  'user A can update own rows'
);

select results_eq(
  format(
    $q$
      update %I
      set updated_at = updated_at
      where %I = current_setting('app.test_user_b')::uuid
      returning id
    $q$,
    :'table_name', :'owner_column'
  ),
  $$ values (null::uuid) limit 0 $$,
  'user A cannot update user B rows'
);

select throws_ok(
  format(
    $q$
      insert into %I (%I)
      values (current_setting('app.test_user_b')::uuid)
    $q$,
    :'table_name', :'owner_column'
  ),
  null,
  'user A cannot create a row owned by user B'
);

select * from finish();

rollback;
