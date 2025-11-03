import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateWorkLocationComponent } from './create-work-location.component';

describe('CreateWorkLocationComponent', () => {
  let component: CreateWorkLocationComponent;
  let fixture: ComponentFixture<CreateWorkLocationComponent>;
  CommonTestingModule.setUpTestBed(CreateWorkLocationComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateWorkLocationComponent,SearchAddressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWorkLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
