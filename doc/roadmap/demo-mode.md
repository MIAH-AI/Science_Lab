# Demo mode

Status: built (November 2026). This page defines the public demo that runs until accounts exist. It does not change [roles and permissions](roles-and-permissions.md); it shows a subset of those roles with sample data.

## What it is

A visitor opens the marketing page, chooses "Try the demo" and picks a role. They land in the app as that role, with no sign-up and no sign-in. Nothing they do is sent to a server.

## Roles in the demo

| Demo role    | From the roles table    | What the visitor can try                                                                                                            | State today |
| ------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Student      | Student, Public learner | Study Desk, all six labs, exam practice, focus timer. Sample tasks set by the demo teacher                                          | Built       |
| Teacher      | Teacher                 | Classroom: put a lab on the board, run a class practice paper, lesson timer. Set a task on a syllabus topic and see who has done it | Built       |
| School admin | School admin            | People: invite by code or class list, approve, disable. Seat meter against the seat cap                                             | Built       |
| Principal    | Principal               | One campus: classes, task completion, lab usage                                                                                     | Built       |
| Director     | Director                | Every campus of the school, with live activity shown without names by default                                                       | Built       |

Not in the demo: Platform admin and Campus IT operator. They are internal and operational roles, not something a school evaluates.

## Rules

1. **No account.** The role is chosen on a public page and kept in the address (`?role=student`; the school screens are fixed by their own address), in the same way Day or Night and the focus timer are carried today.
2. **Sample data is labelled.** Every school screen shows a "Demo · sample data" bar with the role name and a role switcher. The sample school is fictional: "Demo Secondary School", two campuses, class "SS2 Science". No real school, teacher or student names.
3. **Sample figures never leave the demo.** AGENTS.md says not to invent learner progress. Demo figures appear only under the "sample data" bar and never on the real Study Desk.
4. **Nothing is saved on a server.** Changes a visitor makes (a task they set, a user they approve) last for that browser tab and reset with "Restart demo".
5. **The demo proves the screens, not the security.** Real permission checks run on the server (SEC-9) and arrive with accounts. The demo must not be described as showing access control.
6. **Content stays open.** Lessons and labs work without the demo role and without an account (CON-1).

## How it changes when accounts arrive

- The marketing page and the demo stay public.
- "Sign in" appears beside "Try the demo". Signed-in users get the same screens with their real data.
- Whether lessons and labs stay open to visitors who have not signed in is decided by CON-1 in the roadmap, which says they do. Putting all content behind a sign-in needs that requirement to change first.

## Addresses

| Address                                                       | Page                                                  |
| ------------------------------------------------------------- | ----------------------------------------------------- |
| `/`                                                           | Marketing page                                        |
| `/demo`                                                       | Choose a role                                         |
| `/app`                                                        | Study Desk (the student home), today at `/`           |
| `/app/classroom`, `/app/people`, `/app/campus`, `/app/school` | Teacher, School admin, Principal and Director screens |
| `/waec-…`, `/physics_lab_full`, `/chemistry-simulations`      | The six labs, unchanged                               |
