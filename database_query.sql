--Muestra los Eventos registrados
SELECT d.name as date, o.name as origin, c.name as country, ad.name as address, s.name as session, et.name as event, a.name as agent,e.data
FROM events e, origins o, events_type et, dates d, countries c, agents as a, address ad, sessions s
WHERE e.origin_id=o.id
AND e.event_type_id=et.id
AND e.date_id=d.id
AND e.country_id=c.id
AND e.agent_id=a.id
AND e.address_id=ad.id
AND e.session_id=s.id
AND d.name BETWEEN '2020-10-12 00:00:00' AND '2021-12-20 00:00:00'
ORDER BY e.id DESC;