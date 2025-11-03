import { firstValueFrom } from 'rxjs';

export async function jobValidationScript(data, service) {
    const code = 'MAR-LOC-DEP';
    const inputs = data?.work_locations.map(wl => wl?.id) || [];
    let foundationalData = data?.foundational_data?.find(obj => obj?.slug == 'department');
    let results;
    if (foundationalData) {
        results = Array.isArray(foundationalData['foundation_data_id']) ? foundationalData['foundation_data_id'] : [foundationalData['foundation_data_id']];
    } else {
        results = [];
    }

    let filterString = '';
    let isValid;

    for (let i = 0; i < inputs.length; i++) {
        filterString += `&input${i + 1}_id=${inputs[i]}`;
    }
    for (let i = 0; i < results.length; i++) {
        filterString += `&result${i + 1}_id=${results[i]}`;
    }

    await firstValueFrom(service.get(`/configurator/programs/${data.programId}/filter-values?code=${code}${filterString}`))
        .then((result) => {
            isValid = result.valid;
        }).catch(() => {
            console.error('Could not fetch entity mapping data.');
        });

    if (!isValid) {
        const workLocations = data.work_locations.map(wl => wl.name).join(', ');
        if (foundationalData && foundationalData.foundation_data_id) {
            foundationalData = [foundationalData];
        } else if (!foundationalData || !Array.isArray(foundationalData)) {
            foundationalData = [];
        }
        const promises = [];
        let departments = [];
        for (const fd of foundationalData) {
            promises.push(firstValueFrom(service.get(`/configurator/programs/${data.programId}/foundational-data-types/${fd.foundational_data_type_id}/foundational-data/${fd.foundation_data_id}`)))
        }
        await Promise.all(promises).then((results) => {
            departments = results.map(result => result.foundational_data.name);
        });

        let error = `The selected ‘Department’ Master Data - ${departments.join(', ')} is not mapped with the selected Work Location - ${workLocations}, please select valid combinations.`;
        throw new Error(error);
    }

    return true;
}

export async function assignmentValidationScript(data, service) {
    return await jobValidationScript(data, service);
}