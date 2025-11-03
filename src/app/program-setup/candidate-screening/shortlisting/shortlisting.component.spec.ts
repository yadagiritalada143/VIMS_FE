import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ShortlistingComponent } from './shortlisting.component';

describe('ShortlistingComponent', () => {
  let component: ShortlistingComponent;
  let fixture: ComponentFixture<ShortlistingComponent>;

  CommonTestingModule.setUpTestBed(ShortlistingComponent);
  beforeEach(() => {
    fixture = TestBed.createComponent(ShortlistingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
