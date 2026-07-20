-- Delete the "Hockey fietsen" test group and all its related data.
-- Cascading deletes handle group_members, moments, moment_responses, join_requests.
DELETE FROM groups WHERE name = 'Hockey fietsen';
