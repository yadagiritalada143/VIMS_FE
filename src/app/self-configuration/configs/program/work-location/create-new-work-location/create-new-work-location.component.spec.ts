import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateNewWorkLocationComponent } from './create-new-work-location.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';

describe('CreateNewWorkLocationComponent', () => {
  let component: CreateNewWorkLocationComponent;
  let fixture: ComponentFixture<CreateNewWorkLocationComponent>;
  CommonTestingModule.setUpTestBed(CreateNewWorkLocationComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateNewWorkLocationComponent, SearchAddressComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewWorkLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
