import React from 'react';
import { Select, SelectProps } from 'antd';

export interface CountrySelectProps extends SelectProps<string> {
    // Add any specific props if needed
}

export const CountrySelect: React.FC<CountrySelectProps> = (props) => {
    return (
        <Select showSearch placeholder="Select country" {...props}>
            <Select.Option value="Afghanistan">Afghanistan</Select.Option>
            <Select.Option value="Albania">Albania</Select.Option>
            <Select.Option value="Algeria">Algeria</Select.Option>
            <Select.Option value="Argentina">Argentina</Select.Option>
            <Select.Option value="Australia">Australia</Select.Option>
            <Select.Option value="Austria">Austria</Select.Option>
            <Select.Option value="Bangladesh">Bangladesh</Select.Option>
            <Select.Option value="Belgium">Belgium</Select.Option>
            <Select.Option value="Brazil">Brazil</Select.Option>
            <Select.Option value="Bulgaria">Bulgaria</Select.Option>
            <Select.Option value="Canada">Canada</Select.Option>
            <Select.Option value="Chile">Chile</Select.Option>
            <Select.Option value="China">China</Select.Option>
            <Select.Option value="Colombia">Colombia</Select.Option>
            <Select.Option value="Croatia">Croatia</Select.Option>
            <Select.Option value="Czech Republic">Czech Republic</Select.Option>
            <Select.Option value="Denmark">Denmark</Select.Option>
            <Select.Option value="Egypt">Egypt</Select.Option>
            <Select.Option value="Finland">Finland</Select.Option>
            <Select.Option value="France">France</Select.Option>
            <Select.Option value="Germany">Germany</Select.Option>
            <Select.Option value="Greece">Greece</Select.Option>
            <Select.Option value="Hungary">Hungary</Select.Option>
            <Select.Option value="Iceland">Iceland</Select.Option>
            <Select.Option value="India">India</Select.Option>
            <Select.Option value="Indonesia">Indonesia</Select.Option>
            <Select.Option value="Iran">Iran</Select.Option>
            <Select.Option value="Iraq">Iraq</Select.Option>
            <Select.Option value="Ireland">Ireland</Select.Option>
            <Select.Option value="Israel">Israel</Select.Option>
            <Select.Option value="Italy">Italy</Select.Option>
            <Select.Option value="Japan">Japan</Select.Option>
            <Select.Option value="Jordan">Jordan</Select.Option>
            <Select.Option value="Kenya">Kenya</Select.Option>
            <Select.Option value="South Korea">South Korea</Select.Option>
            <Select.Option value="Kuwait">Kuwait</Select.Option>
            <Select.Option value="Lebanon">Lebanon</Select.Option>
            <Select.Option value="Libya">Libya</Select.Option>
            <Select.Option value="Malaysia">Malaysia</Select.Option>
            <Select.Option value="Mexico">Mexico</Select.Option>
            <Select.Option value="Morocco">Morocco</Select.Option>
            <Select.Option value="Netherlands">Netherlands</Select.Option>
            <Select.Option value="New Zealand">New Zealand</Select.Option>
            <Select.Option value="Norway">Norway</Select.Option>
            <Select.Option value="Pakistan">Pakistan</Select.Option>
            <Select.Option value="Peru">Peru</Select.Option>
            <Select.Option value="Philippines">Philippines</Select.Option>
            <Select.Option value="Poland">Poland</Select.Option>
            <Select.Option value="Portugal">Portugal</Select.Option>
            <Select.Option value="Qatar">Qatar</Select.Option>
            <Select.Option value="Romania">Romania</Select.Option>
            <Select.Option value="Russia">Russia</Select.Option>
            <Select.Option value="Saudi Arabia">Saudi Arabia</Select.Option>
            <Select.Option value="Singapore">Singapore</Select.Option>
            <Select.Option value="South Africa">South Africa</Select.Option>
            <Select.Option value="Spain">Spain</Select.Option>
            <Select.Option value="Sweden">Sweden</Select.Option>
            <Select.Option value="Switzerland">Switzerland</Select.Option>
            <Select.Option value="Syria">Syria</Select.Option>
            <Select.Option value="Thailand">Thailand</Select.Option>
            <Select.Option value="Tunisia">Tunisia</Select.Option>
            <Select.Option value="Turkey">Turkey</Select.Option>
            <Select.Option value="Ukraine">Ukraine</Select.Option>
            <Select.Option value="United Arab Emirates">United Arab Emirates</Select.Option>
            <Select.Option value="United Kingdom">United Kingdom</Select.Option>
            <Select.Option value="United States">United States</Select.Option>
            <Select.Option value="Venezuela">Venezuela</Select.Option>
            <Select.Option value="Vietnam">Vietnam</Select.Option>
            <Select.Option value="Yemen">Yemen</Select.Option>
        </Select>
    );
};
