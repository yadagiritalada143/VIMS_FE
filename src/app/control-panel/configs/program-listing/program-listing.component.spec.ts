import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramListingComponent } from './program-listing.component';

describe('ProgramListingComponent', () => {
  let component: ProgramListingComponent;
  let fixture: ComponentFixture<ProgramListingComponent>;
  CommonTestingModule.setUpTestBed(ProgramListingComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProgramListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
