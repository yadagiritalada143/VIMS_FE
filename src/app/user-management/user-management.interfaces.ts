interface FoundationalDataStore {
    id: String;
    name: String;
    options: Array <any>;
    selected: (string | Array <string>);
    multiple?: (boolean | null | undefined); 
    total_records?: number;
    current_page?: number;
    loading?: boolean;
    searchTerm?: string;
};

export { FoundationalDataStore };