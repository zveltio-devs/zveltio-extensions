-- Studio m2m navigation for contact ↔ organization.
-- Junction table already exists (001/004); this only registers the relation.
INSERT INTO zvd_relations
  (name, type, source_collection, source_field, target_collection, target_field,
   junction_table, on_delete, on_update)
VALUES
  ('contact_organizations', 'm2m', 'contacts', 'id', 'organizations', 'id',
   'zvd_contact_organizations', 'CASCADE', 'CASCADE')
ON CONFLICT (source_collection, source_field) DO NOTHING;
